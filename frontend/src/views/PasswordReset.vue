<script setup lang="ts">
import { computed, ref } from 'vue';

const password = ref('');
const passwordCheck = ref('');
const passwordMatched = computed(() => password.value == passwordCheck.value);
const passwordValid = computed(() => password.value.length > 0 && passwordMatched.value);
const sending = ref(false);

const updatePassword = (e: Event) => {
  const token = '';

  fetch('/api/v1/password-reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      password_reset_token: token,
      password: password.value
    })
  });
  password.value;
};
</script>

<template>
  <div :class="$style.outerContainer">
    <div :class="$style.container">
      <h1>Password Reset</h1>
      <dl>
        <dt>New password</dt>
        <dd><input :class="$style.input" type="password" v-model="password" /></dd>
        <dt>New password (confirm)</dt>
        <dd>
          <input
            :class="$style.input"
            :style="{ borderColor: !passwordMatched ? 'red' : undefined }"
            type="password"
            v-model="passwordCheck"
          />
        </dd>
      </dl>
      <button
        :disabled="sending || !passwordValid"
        :class="$style.button"
        :onclick="updatePassword"
      >
        password update
      </button>
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
  transition: background-color ease 0.1s, color ease 0.1s;
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
