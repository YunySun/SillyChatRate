// The main script for the extension
// The following are examples of some basic extension functionality

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { getSettings, is_send_press, settings } from "../../../../script.js";
import { getContext } from "../../../extensions.js";

//You'll likely need to import some other functions from the main script
// import { saveSettingsDebounced } from "../../../../script.js";

// Keep track of where your extension is located, name should match repo name
const extensionName = "SillyChatRate";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
// const extensionSettings = extension_settings[extensionName];
// const defaultSettings = {};


 
// Loads the extension settings if they exist, otherwise initializes them to the defaults.
// async function loadSettings() {
//   //Create the settings if they don't exist
//   extension_settings[extensionName] = extension_settings[extensionName] || {};
//   if (Object.keys(extension_settings[extensionName]).length === 0) {
//     Object.assign(extension_settings[extensionName], defaultSettings);
//   }

//   // Updating settings in the UI
//   $("#example_setting").prop("checked", extension_settings[extensionName].example_setting).trigger("input");
// }

// This function is called when the extension settings are changed in the UI
function onButtonInput(event) {
  let input = $(this).val();
  let value = Math.max(0, Math.min(10, input));
  console.log(value)
  $(this).val(value);
}

// This function is called when the button is clicked
async function onButtonClick() {
  // You can do whatever you want here
  // Let's make a popup appear with the checked setting
  const context = getContext();
  let id = context.characterId;
  let chat = context.chat;
  let characters = context.characters;
  let character = characters[id];
  console.log(character, chat);
  let rate = $('#chat-rate-input').val();
  
  if(is_send_press) {
    toastr.error('正在聊天中，请稍后评价');
    return;
  }

  if(!rate) {
    toastr.error('请填写评分');
    return;
  }

  if(!character) {
    toastr.error('请选择角色卡片');
    return;
  }
  const lastChat = chat[chat.length-1];
  if(lastChat.is_user) {
    toastr.error('请不要评价自己的言论');
    return;
  }

  // 获取本地存储localstorage的聊天记录
  let localChatRate = localStorage.getItem('rate_'+character.name);
  console.log(localChatRate)
  let jsonChatRate;
  if(localChatRate) {
    jsonChatRate = JSON.parse(localChatRate);
    for(let i = 0; i<chat.length; i++) {
      if(jsonChatRate[i] && jsonChatRate[i].rate) {
        chat[i].rate = jsonChatRate[i].rate;
      }
    }
  }
  
  chat[chat.length-1].rate = rate;

  const rateList = chat.filter(chat => chat.hasOwnProperty('rate'))
  if(rateList.length > 0) {
    const rateSum = rateList.reduce((acc, cur) => acc + +(cur.rate), 0);
    const averageRate = (rateSum / rateList.length).toFixed(1);
    $('#chat-rate-result').text(`当前评分:${averageRate}`);
  }

  localStorage.setItem('rate_'+character.name, JSON.stringify(chat, null, 4));
  $('#chat-rate-input').val(5);
  toastr.success('评分成功');
  
}

// 导出事件
function onExportClick() {
  const context = getContext();
  let id = context.characterId;
  let characters = context.characters;
  let character = characters[id];

  if(!character) {
    toastr.error('请选择角色卡片');
    return;
  }

  // 获取本地存储localstorage的聊天记录
  let localChatRate = localStorage.getItem('rate_'+character.name);
  if(localChatRate) {
    // 创建Blob对象
    const blob = new Blob([localChatRate], { type: 'application/json' });

    // 创建下载链接
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${'rate_'+character.name}.json`; // 角色卡json文件

    // 触发点击事件
    document.body.appendChild(downloadLink);
    downloadLink.click();

    // 清理创建的URL对象
    URL.revokeObjectURL(downloadLink.href);
    document.body.removeChild(downloadLink);
  } else {
    toastr.error('暂无评分记录');
    return;
  }
}

// This function is called when the extension is loaded
jQuery(async () => {
  // This is an example of loading HTML from a file
  const settingsHtml = await $.get(`${extensionFolderPath}/index.html`);

  // Append settingsHtml to extensions_settings
  // extension_settings and extensions_settings2 are the left and right columns of the settings menu
  // Left should be extensions that deal with system functions and right should be visual/UI related 
  $("body").append(settingsHtml);

  // These are examples of listening for events
  $("#chat-rate-button").on("click", onButtonClick);
  $("#chat-rate-input").on("input", onButtonInput);
  $('#chat-rate-export').on("click", onExportClick);

  let chatRatePosition = localStorage.getItem('chat-rate-position');
  let chatRatePositionLeft = $('#sheld').offset().left+$('#sheld').outerWidth()+20;
  let chatRatePositionTop = $(window).height() - $('#chat-rate-wrapper').outerHeight() - 20;
  if(chatRatePosition) {
    let chatRatePositionJSON = JSON.parse(chatRatePosition);
    chatRatePositionLeft = chatRatePositionJSON.left;
    chatRatePositionTop = chatRatePositionJSON.top;
  }
  $('#chat-rate-wrapper').css({left: chatRatePositionLeft+'px', top: chatRatePositionTop+'px'})

  $('#chat-rate-wrapper').draggable({
    drag: function(event, ui) {
      const draggableWidth = $(this).outerWidth();
      const draggableHeight = $(this).outerHeight();
      const parentWidth = $(window).width();
      const parentHeight = $(window).height();

      const maxX = parentWidth - draggableWidth;
      const maxY = parentHeight - draggableHeight;

      if (ui.position.left < 0) {
          ui.position.left = 0;
      } else if (ui.position.left > maxX) {
          ui.position.left = maxX;
      }

      if (ui.position.top < 0) {
          ui.position.top = 0;
      } else if (ui.position.top > maxY) {
          ui.position.top = maxY;
      }
    },
    stop: function(event, ui) {
      localStorage.setItem('chat-rate-position', JSON.stringify(ui.position));
    }
  });

  // $('#chat-rate-wrapper').on('mousedown', function(e) {
  //   const offsetX = e.clientX - $(this).offset().left;
  //   const offsetY = e.clientY - $(this).offset().top;
  //   console.log(offsetX, offsetY)

  //   $(document).on('mousemove', function(event) {
  //     const newX = event.clientX - offsetX;
  //     const newY = event.clientY - offsetY;

  //     $('#chat-rate-wrapper').css({ left: newX + 'px', top: newY + 'px' });
  //   });

  //   $(document).on('mouseup', function() {
  //       $(document).off('mousemove');
  //       $(document).off('mouseup');
  //   });
  // })

  // Load settings when starting things up (if you have any)
  // loadSettings();
});