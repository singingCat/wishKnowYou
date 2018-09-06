//index.js
const app = getApp();
var common = require('../../common.js');

Page({
  data: {
    testGroup: [],
    page: 1,
    hasNextPage: true
  },
  onLoad: function () {
    let that = this;
    if (common.localData.currentUser) {
      that.init();
    } else {
      app.userInfoReadyCallback = res => {
        that.init();
      }
    }
  },
  init: function () {
    let that = this;
    that.getNextPage();
  },
  onPullDownRefresh: function () {
    let that = this;
    that.setData({
      hasNextPage: true
    });
    common.request('api/test/all', { pageSize: 20, page: 1 }, function (data) {
      let newRows = data.data.rows;
      let array = [];
      newRows.forEach(function (item, index) {
        array[index] = {
          coverHeadImageUrl: item.coverHeadImageUrl,
          name: item.name,
          completedUserNumber: item.completedUserNumber,
          uuid: item.uuid
        }
      });
      that.setData({
        testGroup: array,
        page: data.data.page + 1,
        hasNextPage: data.data.hasNextPage
      });
      wx.stopPullDownRefresh();
    }, function (data) {
      common.showToastSuccesss('加载失败');
    });
  },
  onReachBottom: function () {
    let that = this;
    that.getNextPage();
  },
  getNextPage: function () {
    let that = this;
    if (that.data.hasNextPage) {
      common.showToastLoading();
      common.request('api/test/all', { pageSize: 20, page: that.data.page }, function (data) {
        let newRows = data.data.rows; //每个测试题的实例
        let array = [];
        newRows.forEach(function(item, index){
          //当前测试自己已测试过,显示为已完成
          let userTest = item.userTest; //自己是否做过的标识
          let notVote = false;
          if (!userTest) {
            notVote = true;
          }
          array[index] = {
            coverHeadImageUrl: item.coverHeadImageUrl,
            name: item.name,
            completedUserNumber: item.completedUserNumber,
            uuid: item.uuid,
            notVote: notVote
          }
        });
        let newGroup = that.data.testGroup.concat(array);
        let newPage = that.data.page + 1; 
        let hasNextPage = data.data.hasNextPage;
        that.setData({
          testGroup: newGroup,
          page: newPage,
          hasNextPage: hasNextPage
        });
        common.hideToast();
      }, function (data) {
        common.showToastSuccesss('加载失败');
      });
    }
  },
  startTest: function (event) {
    let uuid = event.currentTarget.dataset.uuid;
    wx.navigateTo({
      url: '/pages/test/test?testUuid=' + uuid
    })
  }
})
