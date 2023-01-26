<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    :title="refModalInfo.title"
    @ok="handleSubmit"
  >
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form/index';
  import { defHttp } from '/@/utils/http/axios';

  function fGetNoBlankLine(v: string) {
    v = v.replace(new RegExp('\r', 'gm'), '\n');
    while (1) {
      const l1 = v.length;
      v = v.replace(new RegExp('\n\n', 'gm'), '\n');
      const l2 = v.length;
      if (l1 === l2) {
        break;
      }
    }
    v = v.replace(/^\n/, '');
    // v = v.replace(/\n$/, '');
    return v;
  }

  const schemas: FormSchema[] = [];
  export default defineComponent({
    components: { BasicModal, BasicForm },
    setup(_, { emit }) {
      const { currentRoute } = useRouter();
      const route_path = currentRoute.value.path;
      const refModalInfo = ref({ title: '', action: '', schemas });
      const modalInfo = refModalInfo.value;
      const [
        registerForm,
        {
          resetSchema,
          // appendSchemaByField,
          setFieldsValue,
          // setProps
          validate,
        },
      ] = useForm({
        labelWidth: 100,
        baseColProps: { span: 24 },
        schemas,
        showActionButtonGroup: false,
        actionColOptions: {
          span: 24,
        },
      });

      const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
        data && onDataReceive(data);
      });

      function onDataReceive(data: any) {
        for (const k in data) {
          modalInfo[k] = data[k];
        }
        console.log(modalInfo);
        console.log('Data Received', data);
        resetSchema(data.schemas);
      }

      async function handleSubmit() {
        try {
          const values = await validate();
          for (const schema of modalInfo.schemas) {
            if (schema.component === 'InputTextArea') {
              const v = values[schema.field];
              values[schema.field] = fGetNoBlankLine(v);
            }
          }
          setFieldsValue(values);
          setModalProps({ confirmLoading: true });
          // TODO custom api
          console.log('values', values);
          await defHttp.post(
            {
              url: `/panel${route_path}/${modalInfo.action}`,
              params: values,
            },
            { successMessageMode: 'modal' },
          );
          closeModal();
          emit('success');
        } finally {
          setModalProps({ confirmLoading: false });
        }
      }

      return { registerModal, registerForm, refModalInfo, handleSubmit };
    },
  });
</script>
