// 일감마켓 로그인·관심 업체 동기화 (장터와 같은 계정을 씁니다)
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail}
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,serverTimestamp}
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const app=initializeApp({
  apiKey:"AIzaSyC7txkoe-zROxqJ5rrbHsdDTuHrFrAy450",
  authDomain:"sanup-jangter.firebaseapp.com",
  projectId:"sanup-jangter",
  storageBucket:"sanup-jangter.firebasestorage.app",
  messagingSenderId:"162560625771",
  appId:"1:162560625771:web:0d355af8bff1fecde3352e"
});
const auth=getAuth(app), db=getFirestore(app);

function msg(e){
  const c=(e&&e.code)||'';
  if(c.includes('email-already-in-use'))return '이미 가입된 이메일입니다. 로그인해 주세요.';
  if(c.includes('invalid-email'))return '이메일 형식을 확인해 주세요.';
  if(c.includes('weak-password'))return '비밀번호는 6자 이상으로 해 주세요.';
  if(c.includes('invalid-credential')||c.includes('wrong-password')||c.includes('user-not-found'))return '이메일 또는 비밀번호가 맞지 않습니다.';
  if(c.includes('too-many-requests'))return '시도가 너무 많습니다. 잠시 뒤 다시 해 주세요.';
  if(c.includes('network'))return '인터넷 연결을 확인해 주세요.';
  return '처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.';
}
const api={
  user:null, ready:false,
  async login(em,pw){try{await signInWithEmailAndPassword(auth,em,pw);}catch(e){throw new Error(msg(e));}},
  async signup(em,pw){try{await createUserWithEmailAndPassword(auth,em,pw);}catch(e){throw new Error(msg(e));}},
  async reset(em){try{await sendPasswordResetEmail(auth,em);}catch(e){throw new Error(msg(e));}},
  async logout(){await signOut(auth);},
  async pull(){
    if(!auth.currentUser)return null;
    const s=await getDoc(doc(db,'watch',auth.currentUser.uid));
    return s.exists()?s.data():null;
  },
  async push(cos,notify){
    const u=auth.currentUser; if(!u)return;
    await setDoc(doc(db,'watch',u.uid),{email:u.email,cos:cos.slice(0,200),notify:!!notify,updatedAt:serverTimestamp()},{merge:true});
  }
};
window.IGAUTH=api;
onAuthStateChanged(auth,u=>{
  api.user=u?{uid:u.uid,email:u.email}:null; api.ready=true;
  window.dispatchEvent(new CustomEvent('ig-auth'));
});
