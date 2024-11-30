const bc = new BroadcastChannel("box_sw_network_request");
self.addEventListener('install', function (event) {
  // 在这里进行缓存资源等安装操作
  // event.waitUntil(
  //     caches.open('my-cache-v1').then(function (cache) {
  //         return cache.addAll([
  //             // 这里列出需要缓存的文件路径，如 '/index.html', '/styles.css'等
  //         ]);
  //     })
  // );
  // 跳过等待阶段，立即激活
  self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  console.log('sw',url.pathname);
  if (url.pathname.startsWith("/_boxsw/")) {
    // wait until response back
    event.respondWith(
      new Promise((resolve) => {
        const requestObj = {
          id: crypto.randomUUID(),
          type: "request",
          data: {
            url: event.request.url,
            method: event.request.method,
            headers: { ...event.request.headers.entries() },
            body: event.request.body,
          },
        };
        const responseCb = (event) => {
          if (event.data.id === requestObj.id) {
            bc.removeEventListener("message", responseCb);
            resolve(
              new Response(event.data.data.body, {
                status: event.data.data.status,
                statusText: event.data.data.statusText,
                headers: event.data.data.headers,
              }),
            );
          }
        };
        bc.addEventListener("message", responseCb);
        bc.postMessage(requestObj);
      }),
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});
