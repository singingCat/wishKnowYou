//app.js
var common = require('common.js');
App({
  onLaunch: function (ops) {
    let that = this;
    //程序加载获取本地token
    //本地无token调用login
    var launchTokenFail = function () {
      console.log("本地无token");
      wx.login({
        success: function (res) {
          var code = res.code;
          if (code) {
            wx.request({
              url: common.rootUrl + 'wechat/littleApp/login/test/1',
              header: {
                'Content-Type': "application/x-www-form-urlencoded"
              },
              data: {
                jsCode: code
              },
              method: "POST",
              success: function (res) {
                if (res.data.isSuccessful) {
                  if (res.data.currentUser) {
                    common.localData.currentUser = res.data.currentUser;
                    common.setStorage("currentUser", res.data.currentUser, function () {
                      console.log("用户信息存入本地成功");
                    })
                    common.localData.token = res.data.token;
                    common.setStorage("token", res.data.token, function () {
                      console.log("token存入本地成功");
                    })
                  } else {
                    var sessionId = res.data.data;
                    wx.getUserInfo({
                      success: function (data) {
                        wx.request({
                          url: common.rootUrl + 'wechat/littleApp/login/2',
                          data: {
                            encryptedData: data.encryptedData,
                            iv: data.iv,
                            sessionId: sessionId
                          },
                          header: {
                            'Content-Type': "application/x-www-form-urlencoded"
                          },
                          method: "POST",
                          success: function (res) {
                            if (res.data.currentUser) {
                              common.localData.currentUser = res.data.currentUser;
                              common.setStorage("currentUser", res.data.currentUser, function () {
                                console.log("用户信息存入本地成功");
                              });
                              common.localData.token = res.data.token;
                              common.setStorage("token", res.data.token, function () {
                                console.log("token存入本地成功");
                              })
                              common.localData.sessionId = sessionId;
                              common.setStorage("sessionId", sessionId, function () {
                                console.log("sessionId存入本地成功");
                              })
                            }
                            // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回  
                            // 所以此处加入 callback 以防止这种情况
                            if (that.userInfoReadyCallback) {
                              that.userInfoReadyCallback(res);
                            }
                          }
                        })
                      }
                    })
                  }
                }
              },
              fail: function () {
                console.log("网络请求失败");
              }
            })

          };

        },
        fail: function (data) { 
          console.log(data);
         }
      });
    }
    var launchTokenSuccess = function (data) {
      if (data) {
        wx.checkSession({
          success: function () {
            common.localData.token = data.data;
          },
          fail: function () {   //过期了就重新登录授权
            console.log('sessionId已过期');
            launchTokenFail();
          }
        });
      }
    };
    //程序加载获取本地token
    common.getStorage("token", launchTokenSuccess, launchTokenFail);

    //程序加载获取本地user
    var launchUserSuccess = function (data) {
      if (data) {
        common.localData.currentUser = data.data;
      }
    };
    var launchUserFail = function () {
      console.log("本地无user");
    };
    common.getStorage("currentUser", launchUserSuccess, launchUserFail);
    
    //程序加载获取本地sessionId
    var launchSessionIdSuccess = function (data) {
      if (data) {
        common.localData.sessionId = data.data;
      }
    };
    var launchSessionIdFail = function () {
      console.log("本地无sessionId");
    };
    common.getStorage("sessionId", launchSessionIdSuccess, launchSessionIdFail);
    
    if (ops.scene == 1044) {
      common.localData.ops = ops;
    }
    // wx.getSetting({   //先检查是否授权,授权了再获取群id
    //   success: (res) => {
    //     if (res.authSetting['scope.userInfo']) {
    //       if (ops.scene == 1044) {
    //         this.getOpenGId(ops);
    //       }
    //     }
    //   }
    // });
  },
  getOpenGId: function (ops) {
    wx.getShareInfo({
      shareTicket: ops.shareTicket,
      success: function (res) {
        // console.log(res.encryptedData);
        // console.log(res.iv);
        // console.log(common.localData.sessionId);
        common.request('wechat/littleApp/decrypt', 
        { 
          encryptedData: res.encryptedData, 
          iv: res.iv, 
          sessionId: common.localData.sessionId 
        }, function (data) {
          console.log(data);
        }, function (data) {
          console.log('获取openGId失败');
        });
      }
    })
  }
})