import asyncio

import aiohttp
from aiohttp import ClientConnectionError

import json
from urllib.parse import urljoin

class LoopMngr:
  def __init__(self, server_url, handle_post, loop):
    self.handle_msg = handle_post
    self.last_gotten_posts = []
    self.server_url = server_url
    self.asyncio_loop = loop
  
  async def start(self):
      get_post_data_uri = urljoin(self.server_url, "/posts.json")
      if self.asyncio_loop is None:
        self.asyncio_loop = asyncio.get_event_loop()
      
      async with aiohttp.ClientSession() as session:
        while True:
          try:
            async with session.get(get_post_data_uri) as resp:
              data = await resp.json()
              if not resp.status == 200:
                print("Error: " + str(resp.status))
                await asyncio.sleep(10)
                continue

          
              
              tasks = [
                asyncio.create_task(self.handle_msg(post))
                for post in data['latest_posts'] 
                if post not in self.last_gotten_posts
              ]
              self.last_gotten_posts = data['latest_posts']
              await asyncio.gather(*tasks)
              
              
              
          except asyncio.TimeoutError:
            print("Timeout")
            pass #ignore 
            
          except ClientConnectionError:
            break
          except Exception as e:
            print(f'Error: {e.__class__.__name__}: {e}') 

          finally:
            await asyncio.sleep(4)

__all__ = ['LoopMngr']