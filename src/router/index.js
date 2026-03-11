import { createRouter, createWebHistory } from "vue-router";

import LoginPage from "../views/LoginPage.vue";
import RegisterPage from "../views/RegisterPage.vue";
import MainLayout from "../layout/MainLayout.vue";
import DiscoverPage from "../views/home/DiscoverPage.vue";
import FeedPage from "../views/home/FeedPage.vue";
import AvatarFXPage from "../views/AvatarFXPage.vue";
import ProfilePage from "../views/profile/ProfilePage.vue";
import CreateRole from "../views/create/CreateChar.vue";
import CreateScene from "../views/create/CreateScene.vue";
import CreateVoice from "../views/create/CreateVoice.vue";
import ChatPage from "../views/ChatPage.vue";
import VoiceChatPage from "../views/VoiceChatPage.vue";
import CreateVoice2 from "../views/create/CreateVoice2.vue";
import CreateVoice3 from "../views/create/CreateVoice3.vue";

const routes = [
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "", component: DiscoverPage, meta: { showTopbar: true } },
      { path: "feed", component: FeedPage, meta: { showTopbar: true } },
      { path: "profile", component: ProfilePage, meta: { showTopbar: true } },
      { path: "create/role", component: CreateRole, meta: { showTopbar: false } },
      { path: "chat/:character_id", component: ChatPage, meta: { showTopbar: false } },
      {  path: 'chat/:character_id/voice',  component: VoiceChatPage, meta: { showTopbar: false } },
      { path: "create/scene", component: CreateScene , meta: { showTopbar: false }},
      { path: "create/voice", component: CreateVoice, meta: { showTopbar: false } },
      { path: "create/voice2", component: CreateVoice2, meta: { showTopbar: false } },
      { path: "create/voice3", component: CreateVoice3, meta: { showTopbar: false } },
    ],
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
  },
  {
    path: "/register",
    name: "Register",
    component: RegisterPage,
  },
  {
    path: "/avatarfx",
    name: "AvatarFX",
    component: AvatarFXPage,
  },
  { path: "/profile", name: "Profile", component: ProfilePage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
