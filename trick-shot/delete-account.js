'use strict';
const base = "https://quiygtmatwelozdgtbmk.supabase.co", key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1aXlndG1hdHdlbG96ZGd0Ym1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk2MTgsImV4cCI6MjEwNjE1NTYxOH0.xfWAKx-wSKce10-UtgpZxoo4e_Td6KFp4JJVQT7CUHc";
const callback = 'https://berkayozkya.github.io/trick-shot/delete-account.html';
const status = document.getElementById('status');
const deletion = document.getElementById('delete');
const confirmed = document.getElementById('confirm');
let token = null, busy = false;
function b64(bytes) {
 return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function login(provider) {
 try {
  const verifier = b64(crypto.getRandomValues(new Uint8Array(48)));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  sessionStorage.setItem('trickshot_delete_verifier', verifier);
  const params = new URLSearchParams({provider, redirect_to:callback,
   code_challenge:b64(digest), code_challenge_method:'s256'});
  location.assign(base+'/auth/v1/authorize?'+params);
 } catch (_) { status.textContent = 'Sign-in could not be started. Please retry or use the email request below.'; }
}
document.getElementById('google').onclick = () => login('google');
document.getElementById('apple').onclick = () => login('apple');
confirmed.onchange = () => { deletion.disabled = busy || !confirmed.checked || !token; };
document.getElementById('signout').onclick = async () => {
 const previousToken = token; token = null;
 document.getElementById('signed').hidden = true;
 document.getElementById('login').hidden = false;
 confirmed.checked = false; deletion.disabled = true;
 status.textContent = 'Signed out. Your account has not been deleted.';
 if (previousToken) {
  try { await fetch(base+'/auth/v1/logout?scope=local',{method:'POST',
   headers:{apikey:key,Authorization:'Bearer '+previousToken},signal:AbortSignal.timeout(15000)}); } catch (_) {}
 }
};
async function resume() {
 const params = new URLSearchParams(location.search);
 const code = params.get('code');
 if (params.has('error')) {
  history.replaceState(null,'',callback);
  sessionStorage.removeItem('trickshot_delete_verifier');
  status.textContent = 'Sign-in was not completed. Retry or use the email request below.'; return;
 }
 if (!code) return;
 const verifier = sessionStorage.getItem('trickshot_delete_verifier');
 sessionStorage.removeItem('trickshot_delete_verifier');
 history.replaceState(null,'',callback);
 if (!verifier) { status.textContent = 'Sign-in expired. Please start again in this tab.'; return; }
 status.textContent = 'Completing sign-in…';
 try {
  const response = await fetch(base+'/auth/v1/token?grant_type=pkce',{
   method:'POST',headers:{apikey:key,'Content-Type':'application/json'},
   body:JSON.stringify({auth_code:code,code_verifier:verifier}),signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw Error('Sign-in failed. Please try again.');
  const session = await response.json();
  if (!session.access_token || !session.user?.id) throw Error('Sign-in failed.');
  token = session.access_token;
  document.getElementById('identity').textContent = 'Signed in as '+(session.user.email || 'your Trick Shot account');
  document.getElementById('login').hidden = true;
  document.getElementById('signed').hidden = false;
  status.textContent = 'Your account is still active. Confirm deletion only if you want to remove it permanently.';
 } catch (_) { status.textContent = 'Sign-in failed or expired. Retry or use the email request below.'; }
}
deletion.onclick = async () => {
 if (!token || !confirmed.checked || busy) return;
 if (!window.confirm('Permanently delete your Trick Shot account and remaining game balances?')) return;
 busy = true; deletion.disabled = true; document.getElementById('signout').disabled = true;
 status.textContent = 'Deleting your account and game data…';
 try {
  const response = await fetch(base+'/rest/v1/rpc/delete_current_user',{
   method:'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:'{}',signal:AbortSignal.timeout(30000)});
  if (!response.ok) throw Error('Deletion was not completed. Please retry or contact deletion support below.');
  token = null; document.getElementById('signed').hidden = true;
  status.textContent = 'Your account and game data have been deleted. Apple users: remove Trick Shot under Apple Account → Sign in with Apple.';
 } catch (_) { status.textContent = 'Deletion was not completed. Please retry or contact deletion support below.'; }
 finally { busy = false; deletion.disabled = !token || !confirmed.checked; document.getElementById('signout').disabled = false; }
};
resume();
