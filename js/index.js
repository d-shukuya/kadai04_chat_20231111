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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, "chatRoom");

// 新しい Room の追加
$("#room_add_btn").on("click", function () {
  const val = {
    roomName: { 0: "NewChatRoom"},
  };
  const newPostRef = push(dbRef);
  set(newPostRef, val);
});

//最初にデータ取得＆リアルタイムにデータを反映
onChildAdded(dbRef, function (data) {
  const val = data.val();
  const key = data.key;

  let html = `
        <li id="${key}" class="room_item">
            ${val.roomName[0]}
        </li>
    `;

  $("#room_list").append(html);
});

onChildRemoved(dbRef, function (data) {
  $(`#${data.key}`).remove();
});

onChildChanged(dbRef, function (data) {
  $(`#${data.key}`).html(data.val().roomName);
});

$("#room_list").on("click", ".room_item", function () {
  window.location.href = `./html/chat_room.html?roomKey=${this.id}`;
});

// 関数
