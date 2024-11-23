from src import bot
from os import environ as env

Bot = bot("pu6uyun", "071d449ad69b4948da3e4af29602a6cbb39de410ccc47ae533ae759e1ceab1ff")

async def reply_to_mentions(args, raw, bot: bot = Bot):
    # 获取帖子内容和作者
    post = raw
    username = post['username']
    raw_content = post['raw']
    print("post detected")
    # 检查是否被提到
    if bot.username in raw_content or f"@{bot.username}" in raw_content:
        print(f"被提到: {username} 说: {raw_content}")

        # 自动回复
        reply_content = f"Hi @{username}，我看到你提到我了，有什么需要帮助的吗？ 😊"
        await bot.api.send_post(reply_content, post['topic_id'])

# 注册回调
Bot.callback(reply_to_mentions, "post")

# 启动机器人
Bot.run()