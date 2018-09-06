const app = getApp();
var common = require('../../common.js');
Page({
  data: {
    currentUser: null,  //当前用户对象
    currentUserTest: null,    //当前用户测试数据
    friendUser: { headImage: '', name: '', score: '', introduction: '', rankString: '' },   //朋友用户对象
    currentUserId: '',  //当前用户id
    testName: '',       //当前测试名
    testUuid: '',       //当前测试id
    coverBackgroundImageUrl: '',  //封面页背景
    coverHeadImageUrl: '',      //封面页大图
    resultBackgroundImageUrl: '',   //结果页背景
    coverAttendButtonImageUrl: '',  //封面页已测试提示背景
    startButton: '',    //开始测试按钮的背景
    resultTip: '',      //结果提示
    resultTipBackgroundColor: '', //结果页说明背景
    score: '',  //分数
    introduction: '', //描述
    rankString: '', //群排行旁的文字
    total: 0, //总共多少道题
    votes: '',  //投票的结果
    userTests: [],  //群员测试结果暂存
    completedUserNumber: 0,
    userGroup: [],   //群内所有已测试
    voteItems: [],    //关于这个测试的所有信息(展示用)
    allItems: null,   //关于这个测试的所有信息(存储用)
    autoplay: false,          //自动播放
    interval: 1000,           //自动播放间隔
    duration: 300,            //播放完成时间
    vertical: true,           //竖向
    toIndex: 0,               //当前索引
    scrollLeft: 0,            //左滚值
    showWait: false,          //显示等待图表
    showAlreadyVoted: false,  //显示已投票提示
    showGroupContrast: false, //显示封面页群排行
    showNoGroupContrast: false, //显示无排行提示
    showView: false,          //显示生成卡片
    coverShow: true,          //显示封面页
    personalResultShow: false, //显示个人结果页
    otherResultShow: false    //显示别人结果页
  },
  onLoad: function (ops) {
    let that = this;
    let testUuid = ops.testUuid;    //测试题id
    let userUuid = ops.userUuid;    //用户id
    if (common.localData.currentUser) { //如果有用户
      wx.getSetting({   //先检查是否授权,授权了再获取群id
        success: (res) => {
          if (res.authSetting['scope.userInfo']) {  //如果已授权
            if (common.localData.ops) {   //如果有全局ops对象,说明是通过转发进入的小程序
              that.getOpenGidThenInit(testUuid, userUuid);
            } else {                      //否则没有群信息,直接渲染
              that.init(testUuid, userUuid, null);
            }
          }
        }
      });
    } else {
      app.userInfoReadyCallback = res => {  //获取用户信息后再执行这个回调函数
        if(common.localData.ops) {
          that.getOpenGidThenInit(testUuid, userUuid);
        } else {
          that.init(testUuid, userUuid, null);
        }
      }
    }
  },
  //获取群id并渲染页面
  getOpenGidThenInit: function (testUuid, userUuid) {
    let that = this;
    if (common.localData.ops.scene == 1044) {   //如果是通过转发进入的
      wx.getShareInfo({
        shareTicket: common.localData.ops.shareTicket,
        success: function (res) {   //利用抓发票据访问接口获取群id
          common.request('wechat/littleApp/decrypt',
            {
              encryptedData: res.encryptedData,
              iv: res.iv,
              sessionId: common.localData.sessionId
            }, function (data) {
              let openGid = JSON.parse(data.data).openGId;
              console.log(openGid);
              that.init(testUuid, userUuid, openGid);
            }, function (data) {
              console.log('获取openGId失败');
            });
        }
      })
    } else {    //不是通过转发进入的,直接渲染,不包含群信息
      that.init(testUuid, userUuid, null);
    }
  },
  /*初始化*/
  init: function (testUuid, userUuid, openGid) {
    console.log('init');
    let that = this;
    that.setData({
      currentUser: common.localData.currentUser,
      testUuid: testUuid
    });

    let jsonForGet = {};        
    if (userUuid) {             //userUuid存在就展示别人的信息
      jsonForGet = {
        testUuid: testUuid,
        userUuid: userUuid,
        openGid: openGid
      }
    } else {                    //userUuid不存在就展示个人的信息
      jsonForGet = {
        testUuid: testUuid,
        openGid: openGid
      }
    }
    common.request('api/test/get', jsonForGet, function (data) {
      //设置导航条标题
      wx.setNavigationBarTitle({
        title: data.data.name
      });
      
      //当群里有人测试了就显示群排行,否则显示分享提示
      let userTests = data.data.userTests;
      if (userTests.length == 0) {
        that.setData({
          showNoGroupContrast: true
        });
      } else {
        let userGroup = [];
        userTests.forEach(function (item, index) {
          let headImageUrl = item.headImageUrl;
          if (!headImageUrl){
            headImageUrl = '/pages/images/replace.png';
          }
          userGroup[index] = {
            uuid: item.user.uuid,
            name: item.user.name,
            headImageUrl: headImageUrl,
            fraction: Math.floor(item.score),
            introduction: item.testScore.introduction,
            rankString: item.rankString
          }
        });
        that.setData({
          userGroup: userGroup,
          showGroupContrast: true
        });
      }

      //过滤获得的数据
      let testFeeds = data.data.testFeeds;
      let feedsArray = [];
      testFeeds.forEach(function (item, index) {
        feedsArray[index] = {
          title: item.feed.title,
          leftTitle: item.feed.leftTitle,
          rightTitle: item.feed.rightTitle,
          leftImageUrl: item.feed.leftImageUrl,
          rightImageUrl: item.feed.rightImageUrl,
          feedType: item.feed.type,   //类型
          leftUserList: [],
          rightUserList: [],
          voted: false
        }
      });
      //初始化数据
      that.setData({
        testName: data.data.name,
        coverBackgroundImageUrl: data.data.coverBackgroundImageUrl,
        coverHeadImageUrl: data.data.coverHeadImageUrl,
        resultBackgroundImageUrl: data.data.resultBackgroundImageUrl,
        coverAttendButtonImageUrl: data.data.coverAttendButtonImageUrl,
        startButton: 'http://cdn.imalljoy.com/test/common/start_answer.png',
        resultTip: data.data.resultTip,
        resultTipBackgroundColor: data.data.resultTipBackgroundColor,
        completedUserNumber: data.data.completedUserNumber,
        total: data.data.testFeeds.length,
        allItems: feedsArray,
        userTests: data.data.userTests
      });
      //判断如果是自己,并且已经做过,就显示个人结果,不是自己显示朋友结果
      let currentUserTest = data.data.currentUserTest;
      let userTest = data.data.userTest;
      if (!userUuid) {   //如果是自己(userUuid不存在就是自己)
        if (currentUserTest) { //自己已完成测试
          that.showOwnResult(currentUserTest, userTests);
          that.setData({
            toIndex: that.data.allItems.length
          });
        }
      } else {   //否则是别人
        if (currentUserTest){   //做过
          that.showOtherResult(currentUserTest, userTest);
          that.setData({
            currentUserTest: currentUserTest
          });
        } else {    //没做过
          that.showOtherResult(null, userTest);
        }
      }

    }, function (data) {});
  },
  /*显示个人结果页*/
  showOwnResult: function (currentUserTest, userTests) {  //当前用户测试数据,该群所有用户测试数据
    let that = this;
    that.showVoteResult(currentUserTest, null, userTests);
    that.setData({
      coverShow: false,
      personalResultShow: true,
      score: Math.floor(currentUserTest.score),
      introduction: currentUserTest.testScore.introduction,
      rankString: currentUserTest.rankString
    });
  },
  /*显示好友结果页*/
  showOtherResult: function (currentUserTest, userTest) { //当前用户测试数据,选中用户测试数据
    let that = this;
    that.showVoteResult(currentUserTest, userTest, null);
    let headImage = userTest.headImageUrl;
    if (!headImage) {
      headImage = '/pages/images/replace.png';
    }
    that.data.friendUser.headImage = headImage;
    that.data.friendUser.name = userTest.user.name;
    that.data.friendUser.score = Math.floor(userTest.score);
    that.data.friendUser.introduction = userTest.testScore.introduction;
    that.data.friendUser.rankString = userTest.rankString;
    that.setData({
      coverShow: false,
      otherResultShow: true,
      friendUser: that.data.friendUser
    });
  },
  /*显示投票结果*/
  showVoteResult: function (currentUserTest, userTest, userTests) {
    let that = this;
    if (userTest == null) {   //如果userTest为null,那么就是显示自己与所有群员的投票结果
      that.getAllVote(currentUserTest, userTests);
    }
    if (userTests == null) {    //如果userTests为null,那么就是显示自己与这个好友的投票结果
      that.data.allItems.forEach(function (item, index) {   //遍历每条测试信息
        if (userTest) {
          let voteArray = userTest.votes.split(',');
          let headImage = userTest.headImageUrl;
          if (!headImage) {
            headImage = "/pages/images/replace.png";
          }
          if (voteArray[index] == 1) {
            item.leftUserList.unshift({ 'imageUrl': headImage });
          } else {
            item.rightUserList.unshift({ 'imageUrl': headImage });
          }
        }
        if (currentUserTest) {    //如果自己做过了
          that.getOwnVote(item, index, currentUserTest);
        }
        item.voted = true;
      });
    }
    that.setData({
      voteItems: that.data.allItems
    });
  },
  /*获取所有的投票结果*/
  getAllVote: function (currentUserTest, userTests) {
    let that = this;
    that.data.allItems.forEach(function (item, index) {   //遍历每条测试信息
      if (userTests) {    //如果群员测试结果存在
        userTests.forEach(function (elem, i) {
          if (that.data.currentUser && elem.user.uuid == that.data.currentUser.user.uuid) { //如果当前用户测试结果是自己,那么跳过
            return;
          }
          let voteArray = elem.votes.split(',');
          let headImage = elem.user.headImageUrl;
          if (!headImage) {
            headImage = "/pages/images/replace.png";
          }
          if (voteArray[index] == 1) {
            if (that.data.allItems[index].leftUserList.length < 9) {
              that.data.allItems[index].leftUserList.push({ 'imageUrl': headImage });  //将头像放入到左边,暂时用id代替
            }
          } else {
            if (that.data.allItems[index].rightUserList.length < 9) {
              that.data.allItems[index].rightUserList.push({ 'imageUrl': headImage });
            }
          }
        });
      }
      if (currentUserTest) {  //如果自己做过了
        that.getOwnVote(item, index, currentUserTest);
      }
      item.voted = true;
    });
  },
  /*获得自己的投票结果*/
  getOwnVote: function (item, index, currentUserTest) {
    var that = this;
    let currentVotesArray = currentUserTest.votes.split(',');
    let currentUserHeadImage = {
      imageUrl: that.data.currentUser.user.headImageUrl
    }
    if (currentVotesArray[index] == 1) {
      if (item.leftUserList.length >= 9) {
        item.leftUserList.pop();
      }
      item.leftUserList.unshift(currentUserHeadImage);
    } else {
      if (item.rightUserList.length >= 9) {
        item.rightUserList.pop();
      }
      item.rightUserList.unshift(currentUserHeadImage);
    }
  },
  /*点击好友信息*/
  checkFriend: function (e) {
    let that = this;
    let userUuid = e.currentTarget.dataset.item.uuid;
    wx.navigateTo({
      url: '/pages/test/test?testUuid=' + that.data.testUuid + '&userUuid=' + userUuid
    })
  },
  /*排行榜点击向左滚动*/
  scrollLeft: function () {
    let that = this;
    that.setData({
      scrollLeft: that.data.scrollLeft + 200
    });
  },
  /*开始答题*/
  startAnswer: function () {
    let that = this;
    if (that.data.currentUserTest != null) {  //如果已做过测试则提示
      common.showToastSuccesss('已完成该测试');
    } else {    //如果没做过
      if(that.data.voteItems.length == 0) { //投票内容没添加则按顺序添加投票内容
        that.data.voteItems.push(that.data.allItems[0]);
        that.setData({
          voteItems: that.data.voteItems
        });
        that.toNextPage();
      } else {  //投票内容已显示则清空投票内容重新添加
        let allItems = that.data.allItems;
        for (let item of allItems) {
          item.leftUserList = [];
          item.rightUserList = [];
          item.voted = false
        }
        that.setData({
          allItems: allItems,
          voteItems: []
        });
        that.startAnswer();
      }
    }
  },
  /*投左边*/
  voteLeft: function (e) {
    let voting = 1;
    this.voteHandler(e, voting);
  },
  /*投右边*/
  voteRight: function (e) {
    let voting = 2;
    this.voteHandler(e, voting);
  },
  /*投票处理*/
  voteHandler: function (e, voting) {
    let that = this;
    let i = e.currentTarget.dataset.index;
    if (that.data.voteItems[i].voted) {
      that.alreadyVoted();
      return;
    }
    let voteItems = that.data.voteItems;
    let allItems = that.data.allItems;
    let _userList = {
      imageUrl: that.data.currentUser.user.headImageUrl
    }
    voteItems[i].voted = true;

    let userTests = that.data.userTests;
    userTests.forEach(function (item, index) {
      let imageUrl = item.headImageUrl;
      if (!imageUrl) {
        imageUrl = '/pages/images/replace.png';
      }
      if (item.votes.split(',')[i] == 1) {
        if (voteItems[i].leftUserList.length >= 9) {
          return;
        }
        voteItems[i].leftUserList.push({ imageUrl: imageUrl });
      } else {
        if (voteItems[i].rightUserList.length >= 9) {
          return;
        }
        voteItems[i].rightUserList.push({ imageUrl: imageUrl });
      }
    });
    if(voting == 1) {   //如果点了左边那么就把自己添加到左边的数组
      if (voteItems[i].leftUserList.length >= 9) {
        voteItems[i].leftUserList.pop();
      }
      voteItems[i].leftUserList.unshift(_userList);
    } else if (voting == 2) {   //如果点了右边那么就把自己添加到右边的数组
      if (voteItems[i].rightUserList.length >= 9) {
        voteItems[i].rightUserList.pop();
      }
      voteItems[i].rightUserList.unshift(_userList);
    }
    let votes = that.data.votes + ',' + voting;
    that.setData({
      voteItems: voteItems,
      votes: votes
    });

    //如果没选完则继续追加
    if (i + 1 < allItems.length) {
      that.pushItem(i+1);
    } else {    //选完了自动提交展示结果
      let votes = that.data.votes.substring(1);
      let testUuid = that.data.testUuid;
      that.setData({ showWait: true });
      common.request('api/test/submit', { testUuid: testUuid, votes: votes }, function (data) {
        let score = Math.floor(data.data.score);
        let introduction = data.data.testScore.introduction;
        let rankString = data.data.rankString;
        that.setData({
          score: score,
          introduction: introduction,
          rankString: rankString,
          personalResultShow: true,
          showWait: false
        })
        setTimeout(function () { that.toNextPage(); }, 100);
      }, function (data) {
        common.showToastSuccesss('加载失败');
      });
    }
  },
  /*追加一个投票*/
  pushItem: function (index) {
    let that = this;
    let allItems = that.data.allItems;
    let allItemsLenth = allItems.length;
    if (index <= allItemsLenth) {
      that.data.voteItems.push(allItems[index]);
      that.setData({
        voteItems: that.data.voteItems
      });
      that.toNextPage();
    }
  },
  /*下一页*/
  toNextPage: function () {
    let that = this;
    that.setData({
      autoplay: true
    });
    setTimeout(() => {
      that.setData({
        autoplay: false
      });
    }, 1200);
  },
  /*已投票提示*/
  alreadyVoted: function () {
    var that = this;
    that.setData({
      showAlreadyVoted: true
    });
    setTimeout(function () {
      that.setData({
        showAlreadyVoted: false
      });
    }, 1000);
  },
  /*继续测试*/
  continueTest: function () {
    let totalPages = getCurrentPages().length;
    if (totalPages == 1) {
      wx.redirectTo({
        url: '../tests/tests'
      })
    } else {
      wx.navigateBack({
        delta: 1
      })
    }
  },
  /*生成卡片*/
  generateCard: function () {
    let that = this;
    that.data.showView = true;
    that.setData({
      showView: that.data.showView
    })
  },
  /*滑动结束回调函数*/
  onSlideChangeEnd: function () {

  },
  /*转发分享*/
  onShareAppMessage: function (res) {
    wx.showShareMenu({
      withShareTicket: true
    });
    return {
      title: this.data.testName,
      path: '/pages/test/test?testUuid=' + this.data.testUuid + '&userUuid=' + this.data.currentUser.user.uuid,
      success: res => {
        // 转发成功
        wx.getShareInfo({
          shareTicket: res.shareTickets[0],
          success: res => {
            console.log(res.encryptedData);
            console.log(res.iv);
            console.log(common.localData.sessionId);
          }
        })
      },
      fail: function (res) {
        // 转发失败
      }
    }
  }
})