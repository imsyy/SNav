import { defineStore } from "pinia";

const useSetDataStore = defineStore("setData", {
  state: () => {
    return {
      // 主题类别
      themeType: "light",
      // 壁纸类别
      // 0 本地 / 1 必应 / 2 随机风景 / 3 随机动漫 / 4 自定义
      backgroundType: 1,
      backgroundCustom: "",
      // 壁纸遮罩
      showBackgroundGray: true,
      // 壁纸模糊
      backgroundBlur: 0,
      // 搜索引擎
      searchEngine: "bing",
      lastSearchEngine: "bing",
      customEngineUrl: "",
      // 搜索框收起
      smallInput: false,
      // 清空搜索框
      showCleanInput: true,
      // 搜索框自动 focus
      autoFocus: false,
      // 搜索后搜索框自动失焦
      autoInputBlur: true,
      // 时间样式
      timeStyle: "one",
      // 显示农历
      showLunar: false,
      // 是否显秒
      showSeconds: false,
      // 是否显零
      showZeroTime: true,
      // 12 小时制
      use12HourFormat: false,
      // 天气显示
      showWeather: true,
      // 是否显示搜索建议
      showSuggestions: true,
      // 跳转方式
      // open 新标签页 / href 当前页面
      urlJumpType: "open",
    };
  },
  actions: {
    setSearchEngine(value, custom = false) {
      // 储存上次
      if (this.searchEngine !== "custom") {
        this.lastSearchEngine = this.searchEngine;
      }
      // 设置新引擎
      if (custom) {
        this.customEngineUrl = value;
        this.searchEngine = "custom";
        return;
      }
      this.searchEngine = value;
    },
    // 恢复数据
    recoverSiteData(data) {
      let isSuccess = false;
      try {
        for (const key in data) {
          if (Object.hasOwnProperty.call(data, key)) {
            const item = data[key];
            this[key] = item;
          }
        }
        isSuccess = true;
      } catch (error) {
        console.error("站点数据恢复时处理失败：", error);
        isSuccess = false;
      }
      return isSuccess;
    },
  },
  // 开启数据持久化
  persist: {
    key: "setData",
    storage: window.localStorage,
  },
});

export default useSetDataStore;
