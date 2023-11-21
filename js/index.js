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
const dbRef = ref(db, "whiteboardChat");

// 新しい Board の追加
$("#board_add_btn").on("click", function () {
  const val = {
    boardName: { 0: "NewChatBoard"},
  };
  const newPostRef = push(dbRef);
  set(newPostRef, val);
});

//最初にデータ取得＆リアルタイムにデータを反映
onChildAdded(dbRef, function (data) {
  const val = data.val();
  const key = data.key;

  let html = `
        <li id="${key}" class="board_item">
            ${val.boardName[0]}
        </li>
    `;

  $("#board_list").append(html);
});

onChildRemoved(dbRef, function (data) {
  $(`#${data.key}`).remove();
});

onChildChanged(dbRef, function (data) {
  $(`#${data.key}`).html(data.val().boardName);
});

$("#board_list").on("click", ".board_item", function () {
  window.location.href = `./html/chat_board.html?boardKey=${this.id}`;
});

// 関数
