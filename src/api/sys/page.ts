import { defHttp } from '/@/utils/http/axios';

/**
 * @description: 获得登录页的资料
 */
export interface GetLoginPageModel {
  // 登录页标题
  signInTitle: string;
  // 登录页详情
  signInDesc: string;
}

/**
 * @description: getLoginPage
 */
export function getLoginPage() {
  return defHttp.get<GetLoginPageModel>({ url: '/page-login' });
}
