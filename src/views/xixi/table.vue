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
  import { BasicTable, useTable, BasicColumn, BasicTableProps } from '/@/components/Table';
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
      const [registerTable, { reload, setColumns, setProps }] = useTable({
        columns: [
          {
            title: '卡号',
            dataIndex: 'cardnumber',
            width: 150,
          },
          {
            title: '有效月',
            dataIndex: 'expiration_month',
            width: 60,
          },
        ],
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
      }
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
        if (info.searches) {
          props.formConfig = {
            labelWidth: 120,
            schemas: info.searches,
            autoSubmitOnEnter: true,
          };
          props.useSearchForm = true;
        }
        setProps(props);
        setColumns(
          (() => {
            const aRet: BasicColumn[] = [];
            for (const column of info.columns) {
              if (column.editComponent === 'InputNumber') {
                if (0) {
                  //根据输入的数字显示进度条
                  column.editRender = ({ text }) => {
                    return h(Progress, { percent: Number(text) });
                  };
                }
              }
              if (column.customRender) {
                const crlist = column.customRender;
                column.customRender = ({ record }) => {
                  for (const cr of crlist) {
                    if (checkRecordByWhere(record, cr.where)) {
                      const color = cr.color;
                      const label = record[column.dataIndex];
                      return h(Tag, { color }, () => label);
                    }
                  }
                };
              }
              aRet.push(column);
            }
            return aRet;
          })(),
        );
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

      const tplConf = {
        BasicTable: { searchInfo: reactive<Recordable>({}) },
        TableTitle: { title: '', helpMessage: '' },
        toolbars: toolbars,
        ExpExcelModal: {
          register: tplConf_ExpExcelModal_register,
          success: function defaultHeader({ filename, bookType }: ExportModalResult) {
            // 默认Object.keys(data[0])作为header
            const data = [];
            jsonToSheetXlsx({
              data,
              filename,
              write2excelOpts: {
                bookType,
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
