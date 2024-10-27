<template>
  <!-- 捷径 -->
  <div class="shortcut__layout">
    <Transition name="fade" mode="out-in">
      <div v-if="shortcutData[0]" class="shortcut">
        <n-scrollbar class="scrollbar">
          <n-grid
            class="all-shortcut"
            responsive="screen"
            cols="2 s:3 m:4 l:5"
            :x-gap="10"
            :y-gap="10"
          >
            <n-grid-item
              v-for="item in shortcutData"
              :key="item"
              class="shortcut-item"
              @contextmenu="shortCutContextmenu($event, item)"
              @click="shortCutJump(item.url)"
            >
              <span class="name">{{ item.name }}</span>
            </n-grid-item>
            <n-grid-item
              class="shortcut-item"
              @contextmenu="
                (e) => {
                  e.preventDefault();
                }
              "
              @click="addShortcutModalOpen"
            >
              <SvgIcon iconName="icon-add" />
              <span class="name">添加捷径</span>
            </n-grid-item>
          </n-grid>
        </n-scrollbar>
      </div>
      <div v-else class="not-shortcut">
        <span class="tip">暂无捷径，去添加吧</span>
        <n-button strong secondary @click="addShortcutModalOpen">
          <template #icon>
            <SvgIcon iconName="icon-add" />
          </template>
          添加捷径
        </n-button>
      </div>
    </Transition>
    <div class="footer__btn-group">
      <div class="footer__btn" @click="downloadHtmlFile">
        <SvgIcon iconName="icon-xiazai" />
        <span class="btnName">下载</span>
      </div>
      <div class="footer__btn" @click="clickFileDom">
        <input type="file" name="上传" id="shortCutUploadInput" />
        <SvgIcon iconName="icon-shangchuan" />
        <span class="btnName">上传</span>
      </div>
    </div>
  </div>
  <!-- 添加捷径 -->
  <n-modal
    preset="card"
    v-model:show="addShortcutModalShow"
    :title="`${addShortcutModalType ? '编辑' : '添加'}捷径`"
    :bordered="false"
    @mask-click="addShortcutClose"
  >
    <n-form
      ref="addShortcutRef"
      :rules="addShortcutRules"
      :model="addShortcutValue"
      :label-width="80"
    >
      <n-form-item label="ID" path="id">
        <n-input-number
          disabled
          placeholder="请输入ID"
          v-model:value="addShortcutValue.id"
          style="width: 100%"
          :show-button="false"
        />
      </n-form-item>
      <n-form-item label="捷径名称" path="name">
        <n-input
          clearable
          show-count
          maxlength="14"
          v-model:value="addShortcutValue.name"
          placeholder="请输入捷径名称"
        />
      </n-form-item>
      <n-form-item label="站点链接" path="url">
        <n-input clearable v-model:value="addShortcutValue.url" placeholder="请输入站点链接" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button strong secondary @click="addShortcutClose"> 取消 </n-button>
        <n-button strong secondary @click="addOrEditShortcuts">
          {{ addShortcutModalType ? "编辑" : "添加" }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
  <!-- 捷径右键菜单 -->
  <n-dropdown
    placement="bottom-start"
    trigger="manual"
    size="large"
    :x="shortCutDropdownX"
    :y="shortCutDropdownY"
    :options="shortCutDropdownOptions"
    :show="shortCutDropdownShow"
    :on-clickoutside="
      () => {
        shortCutDropdownShow = false;
      }
    "
    @select="shortCutDropdownSelect"
  />
</template>

<script setup>
import { ref, nextTick, h } from "vue";
import {
  NButton,
  NScrollbar,
  NGrid,
  NGridItem,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NDropdown,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { siteStore, setStore } from "@/stores";
import SvgIcon from "@/components/SvgIcon.vue";
import identifyInput from "@/utils/identifyInput";
import { onMounted, onBeforeUnmount } from "vue";

const set = setStore();
const site = siteStore();
const { shortcutData } = storeToRefs(site);

// 图标渲染
const renderIcon = (icon) => {
  return () => {
    return h(SvgIcon, { iconName: `icon-${icon}` }, null);
  };
};

// 添加捷径数据
const addShortcutRef = ref(null);
const addShortcutModalShow = ref(false);
const addShortcutModalType = ref(false); // false 添加 / true 编辑
const addShortcutValue = ref({
  id: null,
  name: "",
  url: "",
});
const addShortcutRules = {
  id: {
    required: true,
    type: "number",
    message: "请输入合法 ID",
    trigger: ["input", "blur"],
  },
  name: {
    required: true,
    message: "请输入名称",
    trigger: ["input", "blur"],
  },
  url: {
    required: true,
    validator(rule, value) {
      if (!value) {
        return new Error("请输入站点链接");
      } else if (identifyInput(value) !== "url") {
        return new Error("请检查是否为正确的网址");
      }
      return true;
    },
    trigger: ["input", "blur"],
  },
};

// 右键菜单数据
const shortCutDropdownX = ref(0);
const shortCutDropdownY = ref(0);
const shortCutDropdownShow = ref(false);
const shortCutDropdownOptions = [
  {
    label: "编辑",
    key: "edit",
    icon: renderIcon("edit"),
  },
  {
    label: "删除",
    key: "delete",
    icon: renderIcon("delete-1"),
  },
];

// 关闭弹窗
const addShortcutClose = () => {
  addShortcutModalShow.value = false;
  addShortcutValue.value = {
    id: null,
    name: "",
    url: "",
  };
};

// 开启添加捷径
const addShortcutModalOpen = () => {
  // 生成 ID
  const shortcutMaxID = shortcutData.value.reduce((max, item) => {
    return item.id > max ? item.id : max;
  }, -1);
  // 生成表单数据
  addShortcutValue.value = {
    id: shortcutMaxID + 1,
    name: "",
    url: "",
  };
  addShortcutModalType.value = false;
  addShortcutModalShow.value = true;
};

// 添加或编辑捷径
const addOrEditShortcuts = () => {
  addShortcutRef.value?.validate((errors) => {
    if (errors) {
      $message.error("请检查您的输入");
      return false;
    }
    // 新增捷径
    if (!addShortcutModalType.value) {
      // 是否重复
      const isDuplicate = shortcutData.value?.some(
        (item) =>
          item.name === addShortcutValue.value.name || item.url === addShortcutValue.value.url,
      );
      if (isDuplicate) {
        $message.error("新增名称或链接与已有捷径重复");
        return false;
      }
      shortcutData.value.push({
        id: addShortcutValue.value.id,
        name: addShortcutValue.value.name,
        url: addShortcutValue.value.url,
      });
      $message.success("捷径添加成功");
      addShortcutClose();
      return true;
    } else {
      // 编辑捷径
      const index = shortcutData.value.findIndex((item) => item.id === addShortcutValue.value.id);
      if (index === -1) {
        $message.error("捷径中不存在该项，请重试");
        return false;
      }
      shortcutData.value[index].name = addShortcutValue.value.name;
      shortcutData.value[index].url = addShortcutValue.value.url;
      $message.success("捷径编辑成功");
      addShortcutClose();
      return true;
    }
  });
};

// 删除捷径
const delShortcuts = () => {
  const deleteId = addShortcutValue.value.id;
  if (typeof deleteId === "number") {
    const indexToRemove = shortcutData.value.findIndex((item) => item.id === deleteId);
    if (indexToRemove !== -1) {
      shortcutData.value.splice(indexToRemove, 1);
      // 将后续元素的 id 前移一位
      for (let i = indexToRemove; i < shortcutData.value.length; i++) {
        shortcutData.value[i].id = i;
      }
      $message.success("捷径删除成功");
      return true;
    }
    $message.error("捷径删除失败，请重试");
  } else {
    $message.error("捷径删除失败，请重试");
  }
};

// 开启右键菜单
const shortCutContextmenu = (e, data) => {
  e.preventDefault();
  shortCutDropdownShow.value = false;
  // 写入弹窗数据
  const { id, name, url } = data;
  addShortcutValue.value = { id, name, url };
  nextTick().then(() => {
    shortCutDropdownShow.value = true;
    shortCutDropdownX.value = e.clientX;
    shortCutDropdownY.value = e.clientY;
  });
};

// 右键菜单点击
const shortCutDropdownSelect = (key) => {
  shortCutDropdownShow.value = false;
  console.log(key);
  switch (key) {
    case "edit":
      addShortcutModalType.value = true;
      addShortcutModalShow.value = true;
      break;
    case "delete":
      $dialog.warning({
        title: "删除捷径",
        content: `确认删除 ${addShortcutValue.value.name} 捷径？此操作将无法恢复！`,
        positiveText: "删除",
        negativeText: "取消",
        onPositiveClick: () => {
          delShortcuts();
        },
      });
      break;
    default:
      break;
  }
};

// 捷径跳转
const shortCutJump = (url) => {
  const urlRegex = /^(https?:\/\/)/i;
  const urlFormat = urlRegex.test(url) ? url : `//${url}`;
  if (set.urlJumpType === "href") {
    window.location.href = urlFormat;
  } else if (set.urlJumpType === "open") {
    window.open(urlFormat, "_blank");
  }
};


// download start
// 点击按钮进行下载html文件
function downloadHtmlFile() {
  let DTinnerStr = "";
  shortcutData.value.forEach((item) => {
    DTinnerStr += `<DT><A HREF="${item.url}" >${item.name}</A> \n`;
  });
  // 定义一个包含 HTML 内容的字符串,下面的格式是模仿书签下载后的文件格式
  const htmlStr = `
    <!DOCTYPE NETSCAPE-Bookmark-file-1>
    <META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
    <meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'none'; img-src data: *; object-src 'none'"></meta>
    <TITLE>Bookmarks</TITLE>
    <H1>SNav导航文件</H1>

    <DL><p>
        <DT><H3 ADD_DATE="1716991740" LAST_MODIFIED="1716991740">SNav导航文件</H3>
        <DL><p>
            ${DTinnerStr}
        </DL><p>
    </DL>
  `;

  // 创建一个 Blob 对象，将 HTML 字符串封装成一个可下载的文件
  const htmlStrBolo = new Blob([htmlStr], { type: "text/html" });
  // 创建一个指向 Blob 对象的 URL
  const htmlStrUrl = URL.createObjectURL(htmlStrBolo);

  // 创建一个链接元素
  const aLink = document.createElement("a");
  // 设置链接的 href 属性为刚刚生成的 URL
  aLink.href = htmlStrUrl;
  // 设置下载文件的名称
  aLink.download = "SNav导航文件.html";
  // 触发链接的点击事件，开始下载
  aLink.click();
  // 释放之前创建的 URL 对象，释放内存
  URL.revokeObjectURL(htmlStrUrl);
}
// download end

// upload start
// 点击按钮上传文件思路
// 1.使用 <input type="file"/> 元素，可以方便地获取文件。
// 2.监听input的change事件，把input元素隐藏起来
// 3.点击上传按钮时，去触发input的点击事件
// 4.通过触发 input 的 change 事件，解析获取到的文件信息
onMounted(() => {
  // 通过触发 input 的 change 事件，解析获取到的文件信息
  document.querySelector("#shortCutUploadInput")?.addEventListener("change", uploadHtmlFile);
});
onBeforeUnmount(() => {
  document.querySelector("#shortCutUploadInput")?.removeEventListener("change", uploadHtmlFile);
});

function uploadHtmlFile() {
  if (this.files) {
    const fileReader = new FileReader();
    fileReader.readAsText(this.files[0]);
    fileReader.onload = function () {
      if (typeof fileReader.result === "string") {
        parserBookmarksFile(fileReader.result);
      }
    };
  }
}

function parserBookmarksFile(result) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(result, "text/html");
  // 获取所有A标签
  const aElements = doc.querySelectorAll("a");
  // 先处理H3元素，构建初始类别
  aElements.forEach((a) => {
    // 判断重复
    const isDuplicate = shortcutData.value?.some(
      (item) => item.name === a.textContent || item.url === a.href,
    );
    if (isDuplicate) {
      return;
    }
    // 添加数据
    shortcutData.value.push({
      id: shortcutData.length,
      name: a.textContent,
      url: a.href,
    });
  });
}
// 上传文件
function clickFileDom() {
  const fileDom = document.querySelector("#shortCutUploadInput");
  if (fileDom) {
    // 点击上传按钮时，去触发input的点击事件
    fileDom.click();
  } else {
    console.warn("元素不存在");
  }
}
// upload end


</script>

<style lang="scss" scoped>
.shortcut__layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  .shortcut {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    .all-shortcut {
      padding: 20px;
      box-sizing: border-box;
      .shortcut-item {
        cursor: pointer;
        height: 60px;
        padding: 0 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--main-background-light-color);
        border-radius: 8px;
        font-size: 16px;
        transition:
          background-color 0.3s,
          box-shadow 0.3s;
        .i-icon {
          width: 1rem;
          margin-right: 6px;
          font-size: 20px;
          opacity: 1;
        }
        .name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        &:hover {
          background-color: var(--main-background-hover-color);
          box-shadow: 0 0 0px 2px var(--main-background-hover-color);
        }
        &:active {
          box-shadow: none;
        }
      }
    }
  }
  .not-shortcut {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    .tip {
      font-size: 24px;
      margin-bottom: 20px;
    }
  }
  .footer__btn-group {
    display: flex;
    padding: 15px 0;
    padding-left: 20px;
    .footer__btn {
      border-radius: 8px;
      width: 80px;
      height: 40px;
      background-color: var(--main-background-light-color);
      line-height: 40px;
      text-align: center;
      cursor: pointer;
      font-size: 16px;
      .btnName {
        margin-left: 2px;
      }
    }
    #shortCutUploadInput {
      display: none;
    }
    div + div {
      margin-left: 10px;
    }
  }
}
</style>
