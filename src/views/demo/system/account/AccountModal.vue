<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts">
  import { defineComponent, ref, computed, unref } from 'vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import { accountFormSchema } from './account.data';
  import { getDeptList, userMgr } from '/@/api/demo/system';

  export default defineComponent({
    name: 'AccountModal',
    components: { BasicModal, BasicForm },
    emits: ['success', 'register'],
    setup(_, { emit }) {
      const isUpdate = ref(true);
      const rowId = ref(0);

      const [registerForm, { setFieldsValue, updateSchema, resetFields, validate }] = useForm({
        labelWidth: 100,
        baseColProps: { span: 24 },
        schemas: accountFormSchema,
        showActionButtonGroup: false,
        actionColOptions: {
          span: 23,
        },
      });

      const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
        resetFields();
        setModalProps({ confirmLoading: false });
        isUpdate.value = !!data?.isUpdate;

        if (unref(isUpdate)) {
          rowId.value = data.record.uid;
          setFieldsValue({
            ...data.record,
          });
        } else {
          rowId.value = 0;
        }
        updateSchema({
          field: 'username',
          rules: [
            {
              required: true,
              message: '请输入用户名',
            },
            {
              validator(_, value) {
                return new Promise((resolve, reject) => {
                  if (typeof value !== 'string' || value === '') {
                    return resolve();
                  }
                  userMgr()
                    .isAccountExist(rowId.value, value)
                    .then(() => resolve())
                    .catch((err) => {
                      reject(err.message || '验证失败');
                    });
                });
              },
            },
          ],
        });
        updateSchema({
          field: 'password',
          required: !unref(isUpdate),
          helpMessage: isUpdate.value ? ['不修改请留空'] : [],
        });

        updateSchema({
          field: 'dept_id',
          componentProps: { treeData: await getDeptList() },
        });
      });

      const getTitle = computed(() => (!unref(isUpdate) ? '新增账号' : '编辑账号'));

      async function handleSubmit() {
        try {
          const values = await validate();
          setModalProps({ confirmLoading: true });
          // TODO custom api
          console.log(values);
          if (unref(isUpdate)) {
            await userMgr().save(rowId.value, values);
          } else {
            await userMgr().add(values);
          }
          closeModal();
          emit('success', { isUpdate: unref(isUpdate), values: { ...values, id: rowId.value } });
        } finally {
          setModalProps({ confirmLoading: false });
        }
      }

      return { registerModal, registerForm, getTitle, handleSubmit };
    },
  });
</script>
