<template>
    <form-element :style="{ maxWidth: '650px' }">
          <fieldset class="k-form-fieldset">
            <legend class="k-form-legend">
              Please fill in the fields:
            </legend>
              <div class="mb-3">
              <field
                :name="'title'"
                :component="'myTemplate'"
                :label="'Title'" 
                :validator="requiredValidator">
                <template v-slot:myTemplate="{props}">
                 <forminput
                    v-bind="props"
                    @change="props.onChange"
                    @blur="props.onBlur"
                    @focus="props.onFocus"
                  />
              </template>
            </field>
            </div>

            <div class="mb-3">
              <field
                :name="'description'"
                :component="'myTemplate'"
                :label="'Description'"
                :validator="requiredValidator" >
                <template v-slot:myTemplate="{props}">
                 <forminput
                    v-bind="props"
                    @change="props.onChange"
                    @blur="props.onBlur"
                    @focus="props.onFocus"
                  />
              </template>
                </field>
            </div>
            <div class="mb-3">
             <field
                  :id="'itemType'"
                  :name="'itemType'"
                  :label="'Item Type'"
                  :component="'myTemplate'"
                  :data-items="sizes"
                  :validator="requiredValidator"
                >
                <template v-slot:myTemplate="{props}">
                    <formdropdownlist
                      v-bind="props"
                      :dataItems="items"
                      @change="props.onChange"
                      @blur="props.onBlur"
                      @focus="props.onFocus"
                    ></formdropdownlist>
                </template>
              </field>
            </div>
          </fieldset>
          <div class="k-form-buttons">
            <button
              type="submit"
              class="k-button"
              :disabled="!kendoForm.allowSubmit"
            >
              Submit
            </button>
               <button
               type="button"
               class="k-button"
                @click="clear">Clear
              </button>
          </div>
        </form-element>
</template>
<script>
import { Field, FormElement } from "@progress/kendo-vue-form";
import FormInput from "./FormInput.vue";
import FormDropDownList from "./FormDropDownList.vue";

const requiredValidator = (value) =>
  value ? "" : "Error: This field is required.";

export default {
    components: {
      field: Field,
      'form-element': FormElement,
      'forminput': FormInput,
      'formdropdownlist': FormDropDownList,
    },
    props: {
        items: Array
    },
    inject: {
      kendoForm: { default: {} },  
    },
    data: function () {
        return { 
          requiredValidator
         };
    },
    methods: {
      handleSubmit (dataItem) {
         alert(JSON.stringify(dataItem, null, 2));
      },
      clear(){
        this.kendoForm.onFormReset();
      }
    }
};

</script>