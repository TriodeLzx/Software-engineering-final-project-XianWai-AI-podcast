import sys
import os
from AI_Text_to_Audio import BaiduTTS

def main():
    APP_ID = ""
    API_KEY = ""
    SECRET_KEY = ""

    tts = BaiduTTS(APP_ID, API_KEY, SECRET_KEY)

    text = "欢迎使用百度语音合成服务，这是一个测试示例。"
    success, result = tts.text_to_speech(text, "test.mp3")

    if success:
        print(f"语音合成成功！文件已保存为: {result}")
    else:
        print(f"语音合成失败: {result}")

if __name__ == "__main__":
    main()