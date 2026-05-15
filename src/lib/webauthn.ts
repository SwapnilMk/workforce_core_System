import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export async function registerBiometric() {
  const resp = await fetch('/api/auth/webauthn/register/options');
  const opts = await resp.json();
  
  const regResp = await startRegistration({ optionsJSON: opts });
  
  const verificationResp = await fetch('/api/auth/webauthn/register/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regResp),
  });
  
  return await verificationResp.json();
}

export async function loginBiometric() {
  const resp = await fetch('/api/auth/webauthn/login/options');
  const opts = await resp.json();
  
  const authResp = await startAuthentication({ optionsJSON: opts });
  
  const verificationResp = await fetch('/api/auth/webauthn/login/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(authResp),
  });
  
  return await verificationResp.json();
}
