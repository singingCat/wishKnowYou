//全局对象 存放token与用户信息
var localData = {
  token: '',
  currentUser: '',
  sessionId: '',
  ops: ''
};
var rootUrl = 'https://test.appweiyuan.com/web/';
//网络请求
function request(url, data, success, fail) {
  wx.request({
    url: rootUrl + url,
    data: data,
    header: {
      'token': localData.token,
      'Content-Type': "application/x-www-form-urlencoded"
    },
    method:"POST",
    success: function (res) {
      // console.log(localData.currentUser)
      if (res.data.isSuccessful) {
        if (success) {
          success(res.data);
          if (res.data.token) {
            localData.token = res.data.token;
            var setTokenSuccess = function () {
              console.log("token storage更新成功");
            };
            setStorage("token", res.data.token, setTokenSuccess);
          }
          if (res.data.currentUser) {
            localData.currentUser = res.data.currentUser;
            var setUserSuccess = function () {
              console.log("user storage更新成功");
            };
            setStorage("currentUser", res.data.currentUser, setUserSuccess);  
          }
        }
      } else {
        showToastSuccesss(res.data.message);
        if (fail) {
          fail();
        };
      };
    },
    fail: function () {
      showToastSuccesss("网络请求失败");
      if (fail) {
        fail()
      }
    }
  });
};
//数据存放本地
function setStorage(key, data, success) {
  wx.setStorage({
    key: key,
    data: data,
    success: success
  });
};
//本地数据读取
function getStorage(key, success, fail) {
  wx.getStorage({
    key: key,
    success: success,
    fail: fail
  });
};
//showToast success方法
function showToastSuccesss(title) {
  wx.showToast({
    title: title,
    icon: 'success',
    duration: 1000
  });
};
//showToast loading方法
function showToastLoading() {
  wx.showToast({
    title: "请稍后…",
    icon: 'loading',
    duration: 10000
  });
};
//隐藏掉showToast方法
function hideToast() {
  wx.hideToast();
}
//消息提示框
function showModal(title, content, success) {
  wx.showModal({
    title: title,
    content: content,
    success: function (res) {
      if (res.confirm) {
        success();
      }
    }
  });
};
//上拉与下拉
function loadPage(currentPage, page, total, url, data, success, fail) {
  if (page == 1) {
    request(url, data, success, fail);
  } else {
    if (page <= total) {
      // wx.showNavigationBarLoading();
      request(url, data, success, fail);
    } else {
      currentPage.setData({
        hasMore: false
      });
    }
  }
};

module.exports = {
  request: request,
  setStorage: setStorage,
  getStorage: getStorage,
  localData: localData,
  rootUrl: rootUrl,
  showToastSuccesss: showToastSuccesss,
  showToastLoading: showToastLoading,
  hideToast: hideToast,
  showModal: showModal,
  loadPage: loadPage
}

