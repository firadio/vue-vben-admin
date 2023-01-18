import {
  AccountParams,
  DeptListItem,
  MenuParams,
  RoleParams,
  RolePageParams,
  MenuListGetResultModel,
  DeptListGetResultModel,
  AccountListGetResultModel,
  RolePageListGetResultModel,
  RoleListGetResultModel,
} from './model/systemModel';
import { defHttp } from '/@/utils/http/axios';

enum Api {
  // 用户管理
  AccountList = '/panel/system/AccountManagement',
  IsAccountExist = '/panel/system/accountExist',
  // 部门管理
  DeptList = '/panel/system/DeptManagement',
  // 菜单管理
  MenuList = '/panel/system/MenuManagement',
  // 角色管理
  RolePageList = '/panel/system/RoleManagement',
  GetAllRoleList = '/panel/system/getAllRoleList',
}

export const getAccountList = (params: AccountParams) =>
  defHttp.get<AccountListGetResultModel>({ url: Api.AccountList, params });

export const getDeptList = (params?: DeptListItem) =>
  defHttp.get<DeptListGetResultModel>({ url: Api.DeptList, params });

export const getMenuList = (params?: MenuParams) =>
  defHttp.get<MenuListGetResultModel>({ url: Api.MenuList, params });

export const getAllRoleList = (params?: RoleParams) =>
  defHttp.get<RoleListGetResultModel>({ url: Api.GetAllRoleList, params });

export const roleMgr = () => {
  // 角色管理的CRUD
  const urlpre = Api.RolePageList;
  return {
    add: (params: any) => defHttp.post({ url: `${urlpre}/add`, params }),
    list: (params?: RolePageParams) =>
      defHttp.get<RolePageListGetResultModel>({ url: urlpre, params }),
    save: (id: number, params: any) => defHttp.post({ url: `${urlpre}/${id}/save`, params }),
    del: (id: number) => defHttp.post({ url: `${urlpre}/${id}/del` }),
  };
};

export const isAccountExist = (account: string) =>
  defHttp.post({ url: Api.IsAccountExist, params: { account } }, { errorMessageMode: 'none' });
