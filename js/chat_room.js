// firebase の import
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  onChildAdded,
  remove,
  onChildRemoved,
  onChildChanged,
} from "https://www.gstatic.com/firebasejs/9.1.1/firebase-database.js";

// roomKey の パース
const urlParams = new URLSearchParams(window.location.search);
const roomKey = urlParams.get("roomKey");

// firebase の変数設定
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let roomRef = ref(db, `whiteboardChat/${roomKey}`);
let roomNameRef = ref(db, `whiteboardChat/${roomKey}/roomName`);
let committedBoardRef = ref(db, `whiteboardChat/${roomKey}/committedBoard`);
let chatRef = ref(db, `whiteboardChat/${roomKey}/chat`);

// canvas の記述
// canvas の変数設定
let canWrite = false;
let oldX = 0;
let oldY = 0;
let lineWidth = 3;
let lineColor = "#000000";

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
$(canvas).on("mousemove", function (e) {
  if (canWrite) {
    const px = e.offsetX;
    const py = e.offsetY;
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
});

// マウスアップイベント
$(canvas).on("mouseup", function () {
  canWrite = false;
});

// マウスアウトイベント
$(canvas).on("mouseout", function () {
  canWrite = false;
});

// 線の色変更イベント
$("#line_color").on("change", function () {
  lineColor = $(this).val();
});

// 線の太さ変更イベント
$("#line_width").on("change", function () {
  lineWidth = $(this).val();
  $("#line_width_text").html(`${lineWidth} px`);
});

// クリアボタン処理
$("#clear_btn").on("click", function () {
  const result = confirm("書いた内容をクリアしますか？");
  if (!result) return;
  ctx.beginPath();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// 投稿ボタン処理
$("#send_btn").on("click", function () {
  // committedBoard へ反映
  // committedBoard を canvas 化
  ctxCommitted.drawImage(committedImg[0], 0, 0, canvasCommitted.width, canvasCommitted.height);

  // 2つの canvas を統合
  ctxTemp.drawImage(canvasCommitted, 0, 0);
  ctxTemp.drawImage(canvas, 0, 0);

  // firebase に保存
  set(committedBoardRef, { 0: canvasTemp.toDataURL() });

  // chat に反映
  const date = new Date();
  const chatVal = {
    writer: $("#account_name").val(),
    createdDate: `${date.getFullYear()}/${
      date.getMonth() + 1
    }/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
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

  // get(roomNameRef)
  //   .then((data) => {
  //     if (data.exists()) {
  //       thisChatRoom = new ChatRoom(roomKey, data.val());
  //       $(`#${data.key}`).html(thisChatRoom.RoomName);
  //     } else {
  //       console.error("読み込みエラー。該当データがありません。元ページから再度遷移してください。");
  //     }
  //   })
  //   .catch((err) => {
  //     console.error(err);
  //   });
});

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
  committedImg.attr("src", src);
  $("#committed_board_div").empty();
  $("#committed_board_div").append(committedImg);
};

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
  $("#chat_list").append(html);
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
