import Vue from 'vue';
import Router from 'vue-router';
import DashboardPage from '@/views/DashboardPage.vue';
import BacklogPage from '@/views/BacklogPage.vue';
import DetailPage from '@/views/DetailPage.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardPage,
    },
    {
      path: '/backlog',
      redirect: '/backlog/open',
    },
    {
      path: '/backlog/:preset',
      name: 'backlog',
      component: BacklogPage,
    },
    {
      path: '/detail/:id',
      redirect: '/detail/:id/details',
    },
    {
      path: '/detail/:id/:screen',
      name: 'detail',
      component: DetailPage,
    },
  ],
});
