from aip import AipSpeech
import urllib.parse


class BaiduTTS:
    """百度语音合成(TTS)封装类

    将文本转换为MP3音频文件，支持多种语音参数配置
    """
    def __init__(self, app_id, api_key, secret_key):
        """初始化百度TTS客户端
        Args:
            app_id: 百度云控制台创建的APP_ID
            api_key: 百度云控制台获取的API_KEY
            secret_key: 百度云控制台获取的SECRET_KEY
        """
        self.app_id = app_id
        self.api_key = api_key
        self.secret_key = secret_key

        # 初始化AipSpeech客户端[citation:5]
        self.client = AipSpeech(app_id, api_key, secret_key)

        # 设置默认参数
        self.default_options = {
            'vol': 5,  # 音量 0-15，默认5[citation:5]
            'spd': 5,  # 语速 0-9，默认5[citation:5]
            'pit': 5,  # 音调 0-9，默认5[citation:5]
            'per': 0,  # 发音人 0为默认女声[citation:5]
        }

    def text_to_speech(self, text, output_file='output.mp3', lang='zh',
                       options=None, cuid='python_tts_client'):
        """将文本转换为语音并保存为MP3文件
        Args:
            text: 要转换的文本（必须小于1024字节）[citation:5]
            output_file: 输出的MP3文件名
            lang: 语言类型，'zh'=中文[citation:1]
            options: 自定义语音参数字典，可选
            cuid: 用户唯一标识[citation:5]

        Returns:
            bool: 转换是否成功
            str: 成功时返回文件名，失败时返回错误信息
        """
        # 检查文本长度
        if len(text.encode('gbk')) > 1024:
            return False, "文本长度超过1024字节限制，请缩短文本或分段处理[citation:5]"

        # 合并默认参数和自定义参数
        speech_options = self.default_options.copy()
        if options:
            speech_options.update(options)

        # 添加cuid到参数中[citation:5]
        speech_options['cuid'] = cuid

        try:
            # 调用百度语音合成接口[citation:1][citation:5]
            # 参数说明: text, lang, cuid(已包含在options中), options
            result = self.client.synthesis(
                text,
                lang,
                1,  # 这个参数在最新SDK中可能被忽略，cuid通过options传递
                speech_options
            )

            # 检查返回结果[citation:1]
            if isinstance(result, dict):
                # 返回错误信息
                error_msg = result.get('err_msg', '未知错误')
                error_no = result.get('err_no', '未知错误码')
                return False, f"语音合成失败: {error_msg} (错误码: {error_no})"
            else:
                # 保存音频文件
                with open(output_file, 'wb') as f:
                    f.write(result)
                return True, output_file

        except Exception as e:
            return False, f"语音合成过程中发生异常: {str(e)}"

    def set_default_option(self, key, value):
        """设置默认语音参数
        Args:
            key: 参数名，如'vol', 'spd', 'pit', 'per'
            value: 参数值
        """
        if key in self.default_options:
            self.default_options[key] = value
        else:
            # 允许设置其他百度支持的参数[citation:1]
            self.default_options[key] = value

    def get_supported_voices(self):
        """获取支持的发音人列表
        Returns:
            dict: 发音人编号和描述
        """
        # 百度TTS支持的发音人选项[citation:1][citation:5]
        voices = {
            # 普通发音人
            0: "度小美 - 默认女声",
            1: "度小宇 - 男声",
            3: "度逍遥(基础) - 情感合成",
            4: "度丫丫 - 情感合成-童声",

            # 精品发音人（可能需要特定权限）[citation:5]
            5003: "度逍遥(精品)",
            5118: "度小鹿",
            106: "度博文",
            110: "度小童",
            111: "度小萌",
            103: "度米朵",
            5: "度小娇"
        }
        return voices

    def text_to_speech_with_retry(self, text, output_file='output.mp3',
                                  max_retries=3, **kwargs):
        """带重试机制的文本转语音
        Args:
            text: 要转换的文本
            output_file: 输出的MP3文件名
            max_retries: 最大重试次数
            **kwargs: 传递给text_to_speech的其他参数

        Returns:
            bool: 转换是否成功
            str: 成功时返回文件名，失败时返回错误信息
        """
        for attempt in range(max_retries):
            success, result = self.text_to_speech(text, output_file, **kwargs)

            if success:
                return True, result

            # 检查是否为可重试的错误[citation:1]
            if "服务器忙" in result or "访问频率受限" in result:
                wait_time = 2 ** attempt  # 指数退避
                print(f"第{attempt + 1}次尝试失败: {result}，{wait_time}秒后重试...")
                import time
                time.sleep(wait_time)
            else:
                # 不可重试的错误
                break

        return False, f"经过{max_retries}次尝试后仍然失败: {result}"


# 使用示例
if __name__ == "__main__":
    APP_ID = ""
    API_KEY = ""
    SECRET_KEY = ""

    tts = BaiduTTS(APP_ID, API_KEY, SECRET_KEY)

    text = "生活就像海洋，只有意志坚强的人才能到达彼岸"
    success, result = tts.text_to_speech(text, "basic_output.mp3")

    if success:
        print(f"语音合成成功！文件已保存为: {result}")
    else:
        print(f"语音合成失败: {result}")

    # 4. 使用自定义参数示例[citation:1]
    custom_options = {
        'spd': 3,
        'pit': 7,
        'vol': 8,
        'per': 1,
    }

    success, result = tts.text_to_speech(
        "现在是自定义参数测试，语速较慢，音调较高。",
        "custom_output.mp3",
        options=custom_options
    )

    # 5. 查看支持的发音人
    voices = tts.get_supported_voices()
    print("\n支持的发音人:")
    for voice_id, description in voices.items():
        print(f"  {voice_id}: {description}")