<template>
  <div>
    <BasicTable
      @register="registerTable"
      @edit-end="handleEditEnd"
      @edit-cancel="handleEditCancel"
      :beforeEditSubmit="beforeEditSubmit"
      :searchInfo="tplConf.BasicTable.searchInfo"
    >
      <template #tableTitle>
        <TableTitle
          :helpMessage="tplConf.TableTitle.helpMessage"
          :title="tplConf.TableTitle.title"
        />
      </template>
      <template #toolbar>
        <a-button
          v-for="item of tplConf.toolbars"
          :key="item.title"
          type="primary"
          @click="item.click"
          >{{ item.title }}</a-button
        >
      </template>
    </BasicTable>
    <XixiModal @register="registerModal" @success="handleSuccess" />
    <ExpExcelModal
      @register="tplConf.ExpExcelModal.register"
      @success="tplConf.ExpExcelModal.success"
    />
  </div>
</template>
<script lang="ts">
  // 1: 导入vue内置组件
  import { defineComponent, h, ref, reactive } from 'vue';
  import { useRouter } from 'vue-router';
  import { Progress, Tag } from 'ant-design-vue';

  // 2: 导入Vben组件
  import {
    BasicTable,
    useTable,
    BasicColumn,
    BasicTableProps,
    FormSchema,
  } from '/@/components/Table';
  import TableTitle from '/@/components/Table/src/components/TableTitle.vue';
  import { useModal } from '/@/components/Modal';
  import XixiModal from './XixiModal.vue';
  import { jsonToSheetXlsx, ExpExcelModal, ExportModalResult } from '/@/components/Excel';

  // 3: 导入Vben其他
  import { defHttp } from '/@/utils/http/axios';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { deepMerge } from '/@/utils';

  // 4: 自定义类型
  interface TableConfigToolbar {
    title: string;
    click: Function;
  }

  // 5: 自定义API
  const fTableMgrApi = (urlpre: string) => {
    // API-CRUD
    const url = '/panel' + urlpre;
    return {
      info: () => defHttp.get({ url, params: { a: 'info' } }),
      add: (params: any) => defHttp.post({ url: `${url}/add`, params }),
      list: (params?: any) => defHttp.get({ url, params }),
      save: (id: number, params: any) => defHttp.post({ url: `${url}/${id}/save`, params }),
      del: (id: number) => defHttp.post({ url: `${url}/${id}/del` }),
      action: (action: string, params: any) => defHttp.post({ url: `${url}/${action}`, params }),
    };
  };

  // 6: 最后导出组件
  export default defineComponent({
    components: { BasicTable, TableTitle, XixiModal, ExpExcelModal },
    setup() {
      // 1: const
      const toolbars: TableConfigToolbar[] = [];
      const { currentRoute } = useRouter();
      const path = currentRoute.value.path;
      //console.log(path);
      const { createMessage } = useMessage();

      const [registerModal, { openModal: openModal_Import }] = useModal();
      const [registerTable, { reload, getColumns, setColumns, setProps, setLoading }] = useTable({
        handleSearchInfoFn(info) {
          console.log('handleSearchInfoFn', info);
          tplConf.LastSearchInfo = info;
          return info;
        },
      });
      const [tplConf_ExpExcelModal_register, { openModal: openModal_ExpExcel }] = useModal();

      function handleEditEnd({ record, index, key, value }: Recordable) {
        console.log(record, index, key, value);
        return false;
      }

      // 模拟将指定数据保存
      function feakSave({ value, key, id }) {
        createMessage.loading({
          content: `正在模拟保存${key}`,
          key: '_save_fake_data',
          duration: 0,
        });
        return new Promise((resolve) => {
          setTimeout(() => {
            if (value === '') {
              createMessage.error({
                content: '保存失败：不能为空',
                key: '_save_fake_data',
                duration: 2,
              });
              resolve(false);
            } else {
              createMessage.success({
                content: `记录${id}的${key}已保存`,
                key: '_save_fake_data',
                duration: 2,
              });
              resolve(true);
            }
          }, 2000);
        });
      }

      async function beforeEditSubmit({ record, index, key, value }) {
        console.log('单元格数据正在准备提交', { record, index, key, value });
        return await feakSave({ id: record.id, key, value });
      }

      function handleEditCancel() {
        console.log('cancel');
      }

      function clickToolbar(data: any) {
        if (data.click === 'fLoadInfo') {
          fLoadInfo();
          return;
        }
        if (data.click === 'openModal_Import') {
          openModal_Import(true, data);
          return;
        }
        if (data.click === 'openModal_ExpExcel') {
          openModal_ExpExcel();
          return;
        }
        if (data.click === 'toolbar_request') {
          toolbar_request(data);
          return;
        }
      }

      function sleep(timeout: number) {
        return new Promise((resolve) => {
          setTimeout(resolve, timeout);
        });
      }

      const toolbar_request = async (data: any) => {
        // 工具栏上面的API
        const params = {
          confirm: 0,
          search: tplConf.LastSearchInfo,
        };
        setLoading(true);
        const body = await fTableMgrApi(path).action(data.action, params);
        setLoading(false);
        await sleep(1);
        if (body.popConfirm) {
          if (confirm(body.popConfirm.title)) {
            params.confirm = 1;
            setLoading(true);
            await fTableMgrApi(path).action(data.action, params);
            setLoading(false);
            reload();
          }
        }
      };
      const checkRecordByWhere = (record: any, where: any) => {
        for (const k in where) {
          if (record[k] !== where[k]) {
            return false;
          }
        }
        return true;
      };
      // 加载表格信息
      const fLoadInfo = async () => {
        createMessage.loading({
          content: `正在加载Info`,
          key: 'fLoadInfo',
          duration: 0,
        });
        const info = await fTableMgrApi(path).info();
        const props: Partial<BasicTableProps> = {};
        props.api = fTableMgrApi(path).list;
        for (const k in info.basic_table_props) {
          props[k] = info.basic_table_props[k];
        }
        if (info.basic_table_props.useSearchForm) {
          if (!props.formConfig) {
            // 提供默认的搜索设置
            props.formConfig = {
              labelWidth: 120,
              autoSubmitOnEnter: true,
            };
          }
          props.formConfig.schemas = ((columns) => {
            const schemas: FormSchema[] = [];
            for (const column of columns) {
              if (column.component) {
                const schema: FormSchema = {
                  field: column.dataIndex,
                  label: column.title,
                  component: column.component,
                };
                if (column.componentProps) {
                  schema.componentProps = column.componentProps;
                }
                schema.colProps = { span: 8 };
                if (column.colProps) {
                  schema.colProps = column.colProps;
                }
                schemas.push(schema);
              }
            }
            return schemas;
          })(info.columns);
          props.useSearchForm = true;
        }
        const fGetColumns = (columns: any[]) => {
          // 从接口中返回的“列配置”中，取得列的设置
          const aRet: BasicColumn[] = [];
          for (const column of columns) {
            if (!column.width) {
              // 没有宽度的列不显示
              continue;
            }
            const mColumn: BasicColumn = {
              title: column.title,
              dataIndex: column.dataIndex,
            };
            if (column.width) {
              mColumn.width = column.width;
            }
            if (column.sorter) {
              mColumn.sorter = column.sorter;
            }
            if (column.editComponent === 'InputNumber') {
              if (0) {
                //根据输入的数字显示进度条
                mColumn.editRender = ({ text }) => {
                  return h(Progress, { percent: Number(text) });
                };
              }
            }
            if (column.customRender) {
              const crlist = column.customRender;
              mColumn.customRender = ({ record }) => {
                for (const cr of crlist) {
                  if (checkRecordByWhere(record, cr.where)) {
                    const color = cr.color;
                    const label = record[column.dataIndex];
                    return h(Tag, { color }, () => label);
                  }
                }
              };
            }
            aRet.push(mColumn);
          }
          return aRet;
        };
        const columns = fGetColumns(info.columns);
        // 修改永久列设置
        props.columns = columns;
        setProps(props);
        if (0) {
          // 临时修改（重置列的时候会被还原）
          setColumns(columns);
        }
        //tplConf.TableTitle.title = info.title;
        for (const k in info.tplConf) {
          tplConf[k] = deepMerge(tplConf[k], info.tplConf[k]);
        }
        tplConf.toolbars = (() => {
          const aRet: any[] = [];
          for (const toolbar of info.toolbars) {
            aRet.push({
              title: toolbar.title,
              click: () => {
                clickToolbar.call(this, toolbar);
              },
            });
          }
          return aRet;
        })();
        createMessage.success({
          content: `Info加载完成`,
          key: 'fLoadInfo',
          duration: 0.1,
        });
        reload();
      };
      fLoadInfo();

      function handleSuccess() {
        reload();
      }

      const fGetVisibleColumns = () => {
        // 取得可见的列名
        const columns = getColumns();
        const ret: BasicColumn[] = [];
        for (const column of columns) {
          if (column.hasOwnProperty('defaultHidden')) {
            if (column.defaultHidden) {
              continue;
            }
          }
          if (column.hasOwnProperty('flag')) {
            if (column.flag === 'ACTION') {
              continue;
            }
          }
          if (!column.hasOwnProperty('dataIndex')) {
            continue;
          }
          ret.push(column);
        }
        return ret;
      };

      const fGetItemsByColumns = (items: any[], aField: string[]) => {
        const aRet: any[] = [];
        for (const item of items) {
          const mRow = {};
          for (const sField of aField) {
            if (item.hasOwnProperty(sField)) {
              mRow[sField] = item[sField];
            }
          }
          aRet.push(mRow);
        }
        return aRet;
      };

      const tplConf = {
        LastSearchInfo: {},
        BasicTable: { searchInfo: reactive<Recordable>({}) },
        TableTitle: { title: '', helpMessage: '' },
        toolbars: toolbars,
        ExpExcelModal: {
          register: tplConf_ExpExcelModal_register,
          success: async function defaultHeader({ filename, bookType }: ExportModalResult) {
            // 默认Object.keys(data[0])作为header
            const mParam = deepMerge(tplConf.LastSearchInfo, { page: 1, pageSize: 10000 });
            const mResult = await fTableMgrApi(path).list(mParam);
            const columns = fGetVisibleColumns();
            const mHeader = {};
            const aHeader: string[] = [];
            for (const column of columns) {
              if (column.dataIndex) {
                const s = column.dataIndex.toString();
                mHeader[s] = column.title;
                aHeader.push(s);
              }
            }
            jsonToSheetXlsx({
              data: fGetItemsByColumns(mResult.items, aHeader),
              header: mHeader,
              filename,
              write2excelOpts: {
                bookType,
              },
              json2sheetOpts: {
                // 指定顺序
                header: aHeader,
              },
            });
          },
        },
      };

      return {
        registerModal,
        registerTable,
        handleEditEnd,
        handleEditCancel,
        beforeEditSubmit,
        handleSuccess,
        tplConf: ref(tplConf),
      };
    },
  });
</script>
