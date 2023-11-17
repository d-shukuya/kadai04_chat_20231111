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
let roomNameRef = ref(db, `whiteboardChat/${roomKey}/roomName`);
let sharedBoardRef = ref(db, `whiteboardChat/${roomKey}/sharedBoard`);

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

// sharedBoard を書き込む canvas
const canvasShard = $("<canvas />")[0];
canvasShard.width = canvas.width;
canvasShard.height = canvas.height;
const ctxShard = canvasShard.getContext("2d");

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
  ctx.beginPath();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// 投稿ボタン処理
$("#send_btn").on("click", function () {
  // sharedBoard を canvas 化
  ctxShard.drawImage(sharedImg[0], 0, 0, canvasShard.width, canvasShard.height);

  // 2つの canvas を統合
  ctxTemp.drawImage(canvasShard, 0, 0);
  ctxTemp.drawImage(canvas, 0, 0);

  // firebase に保存
  set(sharedBoardRef, { 0: canvasTemp.toDataURL() });

  // canvas をリセット
  ctx.beginPath();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctxShard.beginPath();
  ctxShard.clearRect(0, 0, canvasShard.width, canvasShard.height);
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

// ChatRoomName の変更後にフォーカスが外れたときの処理
$("#room_name").on("blur", function () {
  set(roomNameRef, { 0: $(this).text() });
});

//ChatRoomName の変更監視
onChildAdded(roomNameRef, function (data) {
  $("#room_name").html(data.val());
});

onChildRemoved(roomNameRef, function () {
  alert("ChatRoomのデータが見つかりません。TOPへ戻ります。");
  window.location.href = "../index.html";
});

onChildChanged(roomNameRef, function (data) {
  $("#room_name").html(data.val());
});

// sharedBoard の変更監視
let sharedImg = $(`<img />`).attr({ id: "shared_board" });
onChildAdded(sharedBoardRef, function (data) {
  loadSharedImg(data.val());
});

onChildRemoved(sharedBoardRef, function () {
  $("#shared_board_div").empty();
});

onChildChanged(sharedBoardRef, function (data) {
  loadSharedImg(data.val());
});

const loadSharedImg = function (src) {
  sharedImg.attr("src", src);
  $("#shared_board_div").empty();
  $("#shared_board_div").append(sharedImg);
};
