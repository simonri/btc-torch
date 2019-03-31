import Vue from "vue";
import App from "./App.vue";

// Init vue at #app
new Vue({
  render: h => h(App)
}).$mount("#app");
