from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import uuid
from AI_Text_to_Audio import BaiduTTS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'xianwai-secret-key-2024'  # 生产环境请更换为随机密钥
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///xianwai.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# 确保上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)

# 百度TTS配置（请替换为您的实际配置）
BAIDU_APP_ID = os.getenv('BAIDU_APP_ID', '')
BAIDU_API_KEY = os.getenv('BAIDU_API_KEY', '')
BAIDU_SECRET_KEY = os.getenv('BAIDU_SECRET_KEY', '')

# 初始化百度TTS（如果配置了密钥）
tts_client = None
if BAIDU_APP_ID and BAIDU_API_KEY and BAIDU_SECRET_KEY:
    try:
        tts_client = BaiduTTS(BAIDU_APP_ID, BAIDU_API_KEY, BAIDU_SECRET_KEY)
    except Exception as e:
        print(f"警告: 百度TTS初始化失败: {e}")


# 用户模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    audio_history = db.relationship('AudioHistory', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'


# 音频历史记录模型
class AudioHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    voice_id = db.Column(db.Integer, default=0)
    voice_name = db.Column(db.String(100))
    speed = db.Column(db.Integer, default=5)
    pitch = db.Column(db.Integer, default=5)
    volume = db.Column(db.Integer, default=5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<AudioHistory {self.id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,  # 返回完整文本
            'filename': self.filename,
            'audio_url': url_for('download_audio', filename=self.filename),
            'voice_id': self.voice_id,
            'voice_name': self.voice_name,
            'speed': self.speed,
            'pitch': self.pitch,
            'volume': self.volume,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }


# 创建数据库表
with app.app_context():
    db.create_all()


@app.route('/')
def index():
    """首页，如果已登录则跳转到主页，否则跳转到登录页"""
    if 'user_id' in session:
        return redirect(url_for('home'))
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    """登录页面和处理"""
    if request.method == 'GET':
        if 'user_id' in session:
            return redirect(url_for('home'))
        return render_template('login.html')
    
    # POST请求处理登录
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': '请求数据格式错误'}), 400
            
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'success': False, 'message': '用户名和密码不能为空'}), 400
        
        # 查找用户（支持用户名或邮箱登录）
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            session['username'] = user.username
            return jsonify({
                'success': True,
                'message': '登录成功',
                'username': user.username
            }), 200
        else:
            return jsonify({'success': False, 'message': '用户名或密码错误'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': f'登录失败: {str(e)}'}), 500


@app.route('/register', methods=['GET', 'POST'])
def register():
    """注册页面和处理"""
    if request.method == 'GET':
        if 'user_id' in session:
            return redirect(url_for('home'))
        return render_template('register.html')
    
    # POST请求处理注册
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    
    # 验证输入
    if not username or not email or not password:
        return jsonify({'success': False, 'message': '所有字段都不能为空'}), 400
    
    if len(username) < 3 or len(username) > 20:
        return jsonify({'success': False, 'message': '用户名长度应在3-20个字符之间'}), 400
    
    if password != confirm_password:
        return jsonify({'success': False, 'message': '两次输入的密码不一致'}), 400
    
    if len(password) < 6:
        return jsonify({'success': False, 'message': '密码长度至少为6个字符'}), 400
    
    # 检查用户名和邮箱是否已存在
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': '用户名已存在'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': '邮箱已被注册'}), 400
    
    # 创建新用户
    try:
        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        db.session.add(new_user)
        db.session.commit()
        
        # 自动登录
        session['user_id'] = new_user.id
        session['username'] = new_user.username
        
        return jsonify({
            'success': True,
            'message': '注册成功',
            'username': new_user.username
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'注册失败: {str(e)}'}), 500


@app.route('/home')
def home():
    """主页（需要登录）"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('home.html', username=session.get('username'))


@app.route('/logout')
def logout():
    """登出"""
    session.clear()
    return redirect(url_for('login'))


@app.route('/api/user/info')
def user_info():
    """获取当前用户信息"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '未登录'}), 401
    
    user = User.query.get(session['user_id'])
    if user:
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'created_at': user.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        })
    return jsonify({'success': False, 'message': '用户不存在'}), 404


@app.route('/api/generate-audio', methods=['POST'])
def generate_audio():
    """生成音频API"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '未登录'}), 401
    
    if not tts_client:
        return jsonify({
            'success': False,
            'message': '语音服务未配置，请在环境变量中设置BAIDU_APP_ID、BAIDU_API_KEY和BAIDU_SECRET_KEY'
        }), 500
    
    data = request.get_json()
    text = data.get('text', '').strip()
    voice = data.get('voice', 0)
    speed = data.get('speed', 5)
    pitch = data.get('pitch', 5)
    volume = data.get('volume', 5)
    
    if not text:
        return jsonify({'success': False, 'message': '文本不能为空'}), 400
    
    # 检查文本长度（GBK编码）
    byte_length = len(text.encode('gbk'))
    if byte_length > 1024:
        return jsonify({'success': False, 'message': '文本长度超过1024字节限制'}), 400
    
    try:
        # 生成唯一文件名
        filename = f"{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # 获取发音人名称
        voices = tts_client.get_supported_voices()
        voice_name = voices.get(voice, f'发音人{voice}')
        
        # 调用TTS生成音频
        options = {
            'spd': speed,
            'pit': pitch,
            'vol': volume,
            'per': voice
        }
        
        success, result = tts_client.text_to_speech(
            text,
            output_file=filepath,
            options=options,
            cuid=f'user_{session["user_id"]}'
        )
        
        if success:
            # 保存到历史记录
            audio_history = AudioHistory(
                user_id=session['user_id'],
                text=text,
                filename=filename,
                voice_id=voice,
                voice_name=voice_name,
                speed=speed,
                pitch=pitch,
                volume=volume
            )
            db.session.add(audio_history)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': '生成成功',
                'audio_url': url_for('download_audio', filename=filename),
                'filename': filename
            })
        else:
            return jsonify({'success': False, 'message': result}), 500
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'生成失败: {str(e)}'}), 500


@app.route('/api/audio/<filename>')
def download_audio(filename):
    """下载音频文件"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '未登录'}), 401
    
    # 验证文件是否属于当前用户
    audio = AudioHistory.query.filter_by(filename=filename, user_id=session['user_id']).first()
    if not audio:
        return jsonify({'success': False, 'message': '文件不存在或无权访问'}), 403
    
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)


@app.route('/api/history', methods=['GET', 'POST', 'DELETE'])
def history():
    """历史记录API"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '未登录'}), 401
    
    if request.method == 'GET':
        # 获取历史记录列表
        histories = AudioHistory.query.filter_by(user_id=session['user_id'])\
            .order_by(AudioHistory.created_at.desc())\
            .limit(50).all()
        
        return jsonify({
            'success': True,
            'history': [h.to_dict() for h in histories]
        })
    
    elif request.method == 'POST':
        # 保存到历史记录（已废弃，生成时自动保存）
        return jsonify({'success': True, 'message': '已保存'})
    
    elif request.method == 'DELETE':
        # 清空历史记录
        try:
            AudioHistory.query.filter_by(user_id=session['user_id']).delete()
            db.session.commit()
            return jsonify({'success': True, 'message': '历史记录已清空'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'清空失败: {str(e)}'}), 500


@app.route('/api/history/<int:history_id>', methods=['DELETE'])
def delete_history_item(history_id):
    """删除单条历史记录"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '未登录'}), 401
    
    audio = AudioHistory.query.filter_by(id=history_id, user_id=session['user_id']).first()
    if not audio:
        return jsonify({'success': False, 'message': '记录不存在'}), 404
    
    try:
        # 删除文件
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], audio.filename)
        if os.path.exists(filepath):
            os.remove(filepath)
        
        # 删除数据库记录
        db.session.delete(audio)
        db.session.commit()
        
        return jsonify({'success': True, 'message': '删除成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'删除失败: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

