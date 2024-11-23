from .base import LoopMngr, API
import asyncio

class bot:
  server_uri = "https://www.forumorrow.com/"
  def __init__(self, username, token, prefix=None):
    self.username = username
    self.token = token
    self.loop = LoopMngr(self.server_uri, self._handle_post, None)
    self.api = API(self.loop, self.token, self.username)
    
    if prefix is None:
      self.prefix = f"@{self.username}"
    else:
      self.prefix = prefix

    self.callbacks = {}

  def callback(self, callback, id):
    id = id or callback.__name__
    if id not in self.callbacks:
      self.callbacks[id] = [callback]
    else:
      self.callbacks[id].append(callback)

  async def _call_callbacks(self, id, *args, **kwargs):
    cbs = [ callback(*args, **kwargs, bot=self) for callback in self.callbacks.get(id, [])]
    await asyncio.gather(*cbs)
    
  
  async def _handle_post(self, post):
    await self._call_callbacks("raw_pre_post", post)
    
    if post['username'] == self.username:
      return None

    
    args = post['raw'].split()
    if len(args) < 2:
      return None
    
    if type(self.prefix) is list:
      if args[0] in self.prefix:
        await self._call_callbacks('post', post)
    
    elif args[0] == self.prefix:
      print(post)
      await self._call_callbacks('post', args[1:] ,raw=post)

  def run(self):
    asyncio.run(self.__run__())
  
  async def __run__(self):
    await self.api.async_init()
    print("init complete")
    await self.loop.start()