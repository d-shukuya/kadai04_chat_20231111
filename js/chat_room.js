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

const urlParams = new URLSearchParams(window.location.search);
const roomKey = urlParams.get("roomKey");

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let roomNameRef = ref(db, `chatRoom/${roomKey}/roomName`);

// let thisChatRoom;
// ロード時の処理
// $(window).on("load", function () {
//   get(roomNameRef)
//     .then((data) => {
//       if (data.exists()) {
//         thisChatRoom = new ChatRoom(roomKey, data.val());
//         $(`#${data.key}`).html(thisChatRoom.RoomName);
//       } else {
//         console.error("読み込みエラー。該当データがありません。元ページから再度遷移してください。");
//       }
//     })
//     .catch((err) => {
//       console.error(err);
//     });
// });

//最初にデータ取得＆リアルタイムにデータを反映
onChildAdded(roomNameRef, function (data) {
  $('#room_name').html(data.val());
});

// onChildRemoved(dbRef, function (data) {
//   const key = data.key;
//   $(`#${data.key}`).remove();
// });

onChildChanged(roomNameRef, function (data) {
    $('#room_name').html(data.val());
});

$("header>img").on("click", function(){
    window.location.href = '../index.html';
})
