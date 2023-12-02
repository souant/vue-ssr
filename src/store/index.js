import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

/**
 * 创建vuex store
 * @returns vuex store instance
 */
export function createStore() {
  return new Vuex.Store({
    state: {},
    getters: {},
    mutations: {},
    actions: {},
    modules: {},
  });
}
