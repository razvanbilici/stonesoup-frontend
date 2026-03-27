import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import NoteEditor from '../pages/NoteEditor.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/note/:id?', component: NoteEditor }
  ]
});