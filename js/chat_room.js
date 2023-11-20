// firebase の import
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onChildAdded,
  remove,
  onChildRemoved,
  onChildChanged,
} from "https://www.gstatic.com/firebasejs/9.1.1/firebase-database.js";

// roomKey の パース
const urlParams = new URLSearchParams(window.location.search);
const roomKey = urlParams.get("roomKey");

// firebase の変数設定
let thisTabId;
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let roomRef = ref(db, `whiteboardChat/${roomKey}`);
let roomNameRef = ref(db, `whiteboardChat/${roomKey}/roomName`);
let committedBoardRef = ref(db, `whiteboardChat/${roomKey}/committedBoard`);
let editingBoardRef = ref(db, `whiteboardChat/${roomKey}/editingBoard`);
let myEditingBoardRef;
let chatRef = ref(db, `whiteboardChat/${roomKey}/chat`);
let pointerRef = ref(db, `whiteboardChat/${roomKey}/pointer`);
let myPointerRef;

// canvas の記述
// canvas の変数設定
let canWrite = false;
let oldX = 0;
let oldY = 0;
let lineWidth = 3;
let lineColor = "#000000";
let backBoardDisplay = "opacity";
const backBoardDisplayOption = { display: 1.0, opacity: 0.2, none: 0.0 };

// canvas の初期設定
// ユーザーが描画する canvas
const canvas = $("#draw_area")[0];
const ctx = canvas.getContext("2d");

// committedBoard を書き込む canvas
const canvasCommitted = $("<canvas />")[0];
canvasCommitted.width = canvas.width;
canvasCommitted.height = canvas.height;
const ctxCommitted = canvasCommitted.getContext("2d");

// 統合で使用する canvas
const canvasTemp = $("<canvas />")[0];
canvasTemp.width = canvas.width;
canvasTemp.height = canvas.height;
const ctxTemp = canvasTemp.getContext("2d");

// マウスダウンイベント
$(canvas).on("mousedown", function (e) {
  oldX = e.offsetX;
  oldY = e.offsetY;
  canWrite = true;
});

// マウスムーブイベント
let lastMousemoveEventTime = 0;
let delay = 300;
$(canvas).on("mousemove", function (e) {
  const px = e.offsetX;
  const py = e.offsetY;
  if (canWrite) {
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.moveTo(oldX, oldY);
    ctx.lineTo(px, py);
    ctx.stroke();
    oldX = px;
    oldY = py;
  }

  let currentTime = Date.now();
  if (currentTime - lastMousemoveEventTime >= delay) {
    set(myPointerRef, { pointerName: $("#account_name").val(), pointerX: px, pointerY: py });
    // const ptr = $("#test_pointer");
    // ptr.css({ top: py, left: px - 50 });
    lastMousemoveEventTime = currentTime;
  }
});

// マウスアップイベント
$(canvas).on("mouseup", function () {
  canWrite = false;
  setMyEditingBoard();
});

// マウスアウトイベント
$(canvas).on("mouseout", function () {
  if (!canWrite) return;
  canWrite = false;
  setMyEditingBoard();
});

// 編集中の canvas を firebase に保存
function setMyEditingBoard() {
  set(myEditingBoardRef, { 0: canvas.toDataURL() });
}

// 編集中の canvas を firebase から削除
function removeMyEditingBoard() {
  remove(myEditingBoardRef);
}

// 線の色変更イベント
$("#line_color").on("change", function () {
  lineColor = $(this).val();
});

// 線の太さ変更イベント
$("#line_width").on("change", function () {
  lineWidth = $(this).val();
  $("#line_width_text").html(`${lineWidth} px`);
});

// 背景変更イベント
$("#back_board_display").on("change", function () {
  backBoardDisplay = $(this).val();
  const cBoard = $("#committed_board");
  const eBoard = $(".editing_board");
  switch (backBoardDisplay) {
    case "display":
      cBoard.css({ opacity: 1.0 });
      eBoard.css({ opacity: 1.0 });
      break;
    case "opacity":
      cBoard.css({ opacity: 0.1 });
      eBoard.css({ opacity: 0.1 });
      break;
    case "none":
      cBoard.css({ opacity: 0.0 });
      eBoard.css({ opacity: 0.0 });
      break;
    default:
      break;
  }
});

// クリアボタン処理
$("#clear_btn").on("click", function () {
  const result = confirm("書いた内容をクリアしますか？");
  if (!result) return;
  ctx.beginPath();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  removeMyEditingBoard();
});

// 投稿ボタン処理
$("#send_btn").on("click", function () {
  const accountName = $("#account_name").val();
  if (accountName == "") {
    alert("AccountName を入力してから投稿してください。");
    return;
  }

  // committedBoard へ反映
  // committedBoard を canvas 化
  ctxCommitted.drawImage(committedImg[0], 0, 0, canvasCommitted.width, canvasCommitted.height);

  // 2つの canvas を統合
  ctxTemp.drawImage(canvasCommitted, 0, 0);
  ctxTemp.drawImage(canvas, 0, 0);

  // firebase の更新
  set(committedBoardRef, { 0: canvasTemp.toDataURL() });
  removeMyEditingBoard();

  // chat に反映
  const date = new Date();
  const yyyy = date.getFullYear().toString().padStart(4, "0");
  const MM = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  const chatVal = {
    writer: $("#account_name").val(),
    createdDate: `${yyyy}/${MM}/${dd}　${hh}:${mm}:${ss}`,
    img: canvas.toDataURL(),
  };
  const newPastRef = push(chatRef);
  set(newPastRef, chatVal);

  // canvas をリセット
  ctx.beginPath();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctxCommitted.beginPath();
  ctxCommitted.clearRect(0, 0, canvasCommitted.width, canvasCommitted.height);
  ctxTemp.beginPath();
  ctxTemp.clearRect(0, 0, canvasTemp.width, canvasTemp.height);
});

// ロード時の処理
$(window).on("load", function () {
  if (roomKey == null) {
    alert("ChatRoomのデータが見つかりません。TOPへ戻ります。");
    window.location.href = "../index.html";
  }

  // 初期値のセット
  $("#line_width_text").html(`${lineWidth} px`);
  $("#line_width").val("3");
  $("#back_board_display").val(backBoardDisplay);
  thisTabId = generateRandomString(20);
  myEditingBoardRef = ref(
    db,
    `whiteboardChat/${roomKey}/editingBoard/${getMyEditingBoardKey(thisTabId)}`
  );
  myPointerRef = ref(db, `whiteboardChat/${roomKey}/pointer/${getMyPointerKey(thisTabId)}`);
});

// クローズ時の処理
$(window).on("beforeunload", function () {
  removeMyEditingBoard();
  remove(myPointerRef);
});

// 20桁の乱数の作成
function generateRandomString(length) {
  var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var result = "";
  for (var i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function getMyEditingBoardKey(id) {
  return `eBoard-${id}`;
}

function getMyPointerKey(id) {
  return `ptr-${id}`;
}

// ロゴ画像押下時、TOP画面へ遷移
$("header>img").on("click", function () {
  window.location.href = "../index.html";
});

// Room削除ボタン
let isDeleted = false;
$("#delete_room_btn").on("click", function () {
  // 1. 警告
  const result = confirm("この ChatRoom を本当に削除しますか？");
  if (!result) return;
  isDeleted = true;
  remove(roomRef);
  window.location.href = "../index.html";
});

// ChatRoomName の変更後にフォーカスが外れたときの処理
$("#room_name").on("blur", function () {
  set(roomNameRef, { 0: $(this).text() });
});

// firebase の監視処理
//ChatRoomName
onChildAdded(roomNameRef, function (data) {
  $("#room_name").html(data.val());
});

onChildRemoved(roomNameRef, function () {
  if (!isDeleted) {
    alert("ChatRoomのデータが見つかりません。TOPへ戻ります。");
    window.location.href = "../index.html";
  }
});

onChildChanged(roomNameRef, function (data) {
  $("#room_name").html(data.val());
});

// committedBoard
let committedImg = $(`<img />`).attr({ id: "committed_board" });
onChildAdded(committedBoardRef, function (data) {
  loadCommittedImg(data.val());
});

onChildRemoved(committedBoardRef, function () {
  $("#committed_board_div").empty();
});

onChildChanged(committedBoardRef, function (data) {
  loadCommittedImg(data.val());
});

const loadCommittedImg = function (src) {
  committedImg.attr("src", src).css({ opacity: backBoardDisplayOption[backBoardDisplay] });
  $("#committed_board_div").empty();
  $("#committed_board_div").append(committedImg);
};

// editingBoard
onChildAdded(editingBoardRef, function (data) {
  const key = data.key;
  if (key == getMyEditingBoardKey(thisTabId)) return;
  const editingImg = $(`<img />`)
    .attr({ id: key, class: "editing_board", src: data.val()[0] })
    .css({ opacity: backBoardDisplayOption[backBoardDisplay] });
  $("#editing_board_div").append(editingImg);
});

onChildRemoved(editingBoardRef, function (data) {
  const key = data.key;
  if (key == getMyEditingBoardKey(thisTabId)) return;
  $(`#${key}`).remove();
});

onChildChanged(editingBoardRef, function (data) {
  const key = data.key;
  if (key == getMyEditingBoardKey(thisTabId)) return;
  $(`#${key}`).attr("src", data.val()[0]);
});

// chat
onChildAdded(chatRef, function (data) {
  const val = data.val();
  const key = data.key;
  let html = `
    <div id="${key}" class="chat_item">
      <p class="chat_item_name">${val.writer}</p>
      <p class="chat_item_date">${val.createdDate}</p>
      <img src="${val.img}" alt="" class="chat_item_img">
  </div>
  `;
  $("#chat_list").prepend(html);
});

onChildRemoved(chatRef, function (data) {
  $(`#${data.key}`).remove();
});

onChildChanged(chatRef, function (data) {
  const val = data.val();
  let html = `
    <p class="chat_item_name">${val.writer}</p>
    <p class="chat_item_date">${val.createdDate}</p>
    <img src="${val.img}" alt="" class="chat_item_img">
  `;
  $(`#${data.key}`).html(html);
});

// pointer
let pointerColorNum = 1;
onChildAdded(pointerRef, function (data) {
  const key = data.key;
  const val = data.val();
  if (key == getMyPointerKey(thisTabId)) return;
  let ptr = $("<div />")
    .attr({ id: key, class: "pointer" })
    .css({ top: val.pointerY, left: val.pointerX - 50 });
  let html = `
    <img src="../img/pointer_${pointerColorNum}.png" alt="">
    <label for="pointer">${val.pointerName}</label>
  `;
  ptr.append(html);
  $("#pointer_div").append(ptr);
  if (pointerColorNum == 8) {
    pointerColorNum = 1;
  } else {
    pointerColorNum++;
  }
});

onChildRemoved(pointerRef, function (data) {
  $(`#${data.key}`).remove();
});

onChildChanged(pointerRef, function (data) {
  const key = data.key;
  const val = data.val();
  $(`#${key}>label`).html(val.pointerName);
  $(`#${key}`).css({ top: val.pointerY, left: val.pointerX - 50 });
});
