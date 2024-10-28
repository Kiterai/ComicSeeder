<script setup lang="ts">
import router from '@/router';
import { ref } from 'vue';

const email = ref('');
const password = ref('');
const sending = ref(false);

const login = () => {
  fetch('/api/v1/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email.value,
      password: password.value
    })
  })
    .then(() => {
      router.push('/');
    })
    .catch(() => {
      alert('Login failed.');
    });
};
</script>

<template>
  <div :class="$style.outerContainer">
    <div :class="$style.container">
      <h1>Login</h1>
      <dl>
        <dt>Email</dt>
        <dd><input :class="$style.input" type="text" v-model="email" /></dd>
        <dt>Password</dt>
        <dd><input :class="$style.input" type="password" v-model="password" /></dd>
      </dl>
      <button :disabled="sending" :class="$style.button" :onclick="login">Login</button>
    </div>
  </div>
</template>

<style module>
.outerContainer {
  width: 100dvw;
  height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
.container {
  width: 20rem;
  max-width: 100%;
}
.input {
  height: 2rem;
  box-sizing: border-box;
  border: 0.1rem solid #484;
  outline: none;
  border-radius: 0.2rem;
  width: 100%;
}
.button {
  border: 0.1rem solid #484;
  border-radius: 0.2rem;
  color: #000;
  background-color: #dfd;
  vertical-align: bottom;
  margin-top: 0.4rem;
  height: 2rem;
  box-sizing: border-box;
  width: 100%;
  transition:
    background-color ease 0.1s,
    color ease 0.1s;
}
.button:hover {
  background-color: #484;
  color: #fff;
}
.button:disabled {
  border-color: #888;
  color: #888;
  background-color: #ddd;
}
</style>
