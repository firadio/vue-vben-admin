import { BasicColumn } from '/@/components/Table';
import { FormSchema } from '/@/components/Table';
import { h } from 'vue';
import { Tag } from 'ant-design-vue';
import { Icon } from '/@/components/Icon';

const status_option = [
  { label: '默认', value: 0, color: 'blue' },
  { label: '启用', value: 1, color: 'green' },
  { label: '停用', value: 2, color: 'red' },
];
const fGetStatusRow = (value: number) => {
  for (const mRow of status_option) {
    if (mRow.value === value) {
      return mRow;
    }
  }
};

export const columns: BasicColumn[] = [
  {
    title: '菜单名称',
    dataIndex: 'title',
    width: 200,
    align: 'left',
  },
  {
    title: '图标',
    dataIndex: 'icon',
    width: 50,
    customRender: ({ record }) => {
      return h(Icon, { icon: record.icon });
    },
  },
  {
    title: 'Name',
    dataIndex: 'name',
    width: 120,
  },
  {
    title: '路径',
    dataIndex: 'path',
    width: 120,
  },
  {
    title: '组件',
    dataIndex: 'component',
    width: 180,
  },
  {
    title: '排序',
    dataIndex: 'orderNo',
    width: 50,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 50,
    customRender: ({ record }) => {
      const mRow = fGetStatusRow(record.status);
      return h(Tag, { color: mRow?.color }, () => mRow?.label);
    },
  },
  {
    title: '缓存',
    dataIndex: 'keepalive',
    width: 50,
    customRender: ({ record }) => {
      const mRow = fGetStatusRow(record.keepalive);
      return h(Tag, { color: mRow?.color }, () => mRow?.label);
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 150,
  },
];

const isDir = (type: number) => type === 0;
const isMenu = (type: number) => type === 1;
const isButton = (type: number) => type === 2;

export const searchFormSchema: FormSchema[] = [
  {
    field: 'title',
    label: '菜单名称',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      options: status_option,
    },
    colProps: { span: 8 },
  },
];

export const formSchema: FormSchema[] = [
  {
    field: 'type',
    label: '菜单类型',
    component: 'RadioButtonGroup',
    defaultValue: '0',
    componentProps: {
      options: [
        { label: '目录', value: 0 },
        { label: '菜单', value: 1 },
        { label: '按钮', value: 2 },
      ],
    },
    colProps: { lg: 24, md: 24 },
  },
  {
    field: 'name',
    label: 'Name',
    component: 'Input',
    required: true,
  },
  {
    field: 'title',
    label: '菜单名称',
    component: 'Input',
    required: true,
  },
  {
    field: 'parent_id',
    label: '上级菜单',
    component: 'TreeSelect',
    componentProps: {
      fieldNames: {
        label: 'title',
        key: 'id',
        value: 'id',
      },
      getPopupContainer: () => document.body,
    },
  },

  {
    field: 'orderNo',
    label: '排序',
    component: 'InputNumber',
    required: true,
  },
  {
    field: 'icon',
    label: '图标',
    component: 'IconPicker',
    required: true,
    ifShow: ({ values }) => !isButton(values.type),
  },

  {
    field: 'path',
    label: '路由地址',
    component: 'Input',
    required: true,
    ifShow: ({ values }) => !isButton(values.type),
  },
  {
    field: 'component',
    label: '组件路径',
    component: 'Input',
    ifShow: ({ values }) => isMenu(values.type),
  },
  {
    field: 'status',
    label: '状态',
    component: 'RadioButtonGroup',
    defaultValue: 0,
    componentProps: {
      options: status_option,
    },
  },
  {
    field: 'keepalive',
    label: '缓存',
    component: 'RadioButtonGroup',
    defaultValue: 0,
    componentProps: {
      options: status_option,
    },
    ifShow: ({ values }) => isMenu(values.type),
  },
  {
    field: 'redirect',
    label: '重定向',
    component: 'Input',
    ifShow: ({ values }) => isDir(values.type),
  },
];
