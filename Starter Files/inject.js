(function () {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
      this._url = url; // Save URL for later use
      return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
      this.addEventListener("load", function () {
          if (this.status >= 200 && this.status < 300) {
              const data = {
                  url: this._url,
                  status: this.status,
                  response: this.responseText,
              };

              // Post data to the content script via window
              window.postMessage({ type: "xhrDataFetched", detail: data }, "*");
          }
      });

      return originalSend.apply(this, arguments);
  };
})();
