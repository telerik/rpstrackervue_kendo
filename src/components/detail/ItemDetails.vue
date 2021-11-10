<template>
  <div>
    <form>
      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Title</label>
        <div class="col-sm-10">
          <input class="form-control" v-model="itemForm.title" @blur="onBlurTextField" name="title">
        </div>
      </div>

      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Description</label>
        <div class="col-sm-10">
          <textarea
            class="form-control"
            v-model="itemForm.description"
            @blur="onBlurTextField"
            name="description"
          ></textarea>
        </div>
      </div>

      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Item Type</label>
        <div class="col-sm-10">
           <kendo-dropdownlist
            v-model="itemForm.typeStr"
            :data-items="itemTypesProvider"
            @change="onNonTextFieldChange"
            :item-render="'myTemplate'"
            name="itemType"
          >
            <template v-slot:myTemplate="{props}">
              <div @click="(ev) => props.onClick(ev)">
                <img src="itemSrc(props.dataItem)" class="backlog-icon" />
                <span>
                  {{ props.dataItem }}
                </span>
              </div>
            </template>
          </kendo-dropdownlist>
        </div>
      </div>

      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Status</label>
        <div class="col-sm-10">
           <kendo-dropdownlist
            v-model="itemForm.statusStr"
            :data-items="statusesProvider"
            @change="onNonTextFieldChange"
            name="itemStatus"
          ></kendo-dropdownlist>
        </div>
      </div>

      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Estimate</label>
        <div class="col-sm-10">
          <kendo-slider
            :value="itemForm.estimate"
            :min="0"
            :max="20"
            @change="onSliderChange"
            name="estimate"
          ></kendo-slider>
        </div>
      </div>

      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Priority</label>
        <div class="col-sm-10">
           <kendo-dropdownlist
            v-model="itemForm.priorityStr"
            :data-items="prioritiesProvider"
            @change="onNonTextFieldChange"
             :item-render="'myTemplate'"
            :template="(p)=>itemPriorityTemplate(p)"
            name="itemPrority"
          >
            <template v-slot:myTemplate="{props}">
              <div @click="(ev) => props.onClick(ev)">
                <span :class="indicatorClass(props.dataItem)">{{ props.dataItem }}</span>
               </div>
            </template>
          </kendo-dropdownlist>
        </div>
      </div>

      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Assignee</label>

        <div class="col-sm-10">
          <img :src="selectedAssignee.avatar" class="li-avatar rounded">
          <span>{{itemForm.assigneeName}}</span>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="assigneePickerOpen"
          >Pick assignee</button>
        </div>
      </div>
      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Change Avatar</label>
          <upload
            :restrictions="{
                allowedExtensions: [ '.jpg', '.png' ]
            }"
            :default-files="[]"
            :with-credentials="false"
            :save-url="'https://demos.telerik.com/kendo-ui/service-v4/upload/save'"
            :remove-url="'https://demos.telerik.com/kendo-ui/service-v4/upload/remove'"       
          :multiple="false"
          @statuschange="UploadStatusChange"
        />
      </div>
    </form>

    <transition v-if="showAddModal">
      <div class="modal-mask">
        <div class="modal-wrapper">
          <div class="modal-container">
            <div class="modal-header">
              <h4 class="modal-title" id="modal-basic-title">Select Assignee</h4>
              <button type="button" class="close" @click="toggleModal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <div class="modal-body">
              <ul class="list-group list-group-flush">
                <li
                  v-for="user in users"
                  class="list-group-item d-flex justify-content-between align-items-center"
                  @click="assigneePickerClose(user)"
                  :key="user.id"
                >
                  <span>{{ user.fullName }}</span>
                  <span class="badge">
                    <img :src="user.avatar" class="li-avatar rounded mx-auto d-block">
                  </span>
                </li>
              </ul>
            </div>

            <div class="modal-footer"></div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, toRefs } from "vue";
import { Observable } from "rxjs";

import { PtItem, PtUser } from "@/core/models/domain";
import {
  ItemType,
  PT_ITEM_STATUSES,
  PT_ITEM_PRIORITIES,
} from "@/core/constants";
import {
  PtItemDetailsEditFormModel,
  ptItemToFormModel,
} from "@/shared/models/forms/pt-item-details-edit-form";
import { DropDownListVue3 as DropDownList, DropDownListChangeEvent } from '@progress/kendo-vue-dropdowns';
import { SliderVue3 as Slider, SliderChangeEvent } from '@progress/kendo-vue-inputs';
import { Upload, UploadOnStatusChangeEvent } from '@progress/kendo-vue-upload';
import { PtItemType } from "@/core/models/domain/types";
import { PriorityEnum } from "@/core/models/domain/enums";
import { getIndicatorClass } from '@/shared/helpers/priority-styling';

export default defineComponent({
  name: "PtItemChitchat",
  components: {
    'kendo-dropdownlist': DropDownList,
    "kendo-slider": Slider,
    'upload': Upload,
  },
  props: {
    item: {
      type: Object as PropType<PtItem>,
      default: () => ({
        description: "",
      }),
    },
    usersObs: {
      type: Object as PropType<Observable<PtUser[]>>,
      required: true
    }
  },
  setup(props, context) {
    const itemTypesProvider = ref(ItemType.List.map((t) => t.PtItemType));
    const statusesProvider = ref(PT_ITEM_STATUSES);
    const prioritiesProvider = ref(PT_ITEM_PRIORITIES);

    const showAddModal = ref(false);
    const users = ref<PtUser[]>([]);
    const itemForm = ref<PtItemDetailsEditFormModel | undefined>();
    const selectedAssignee = ref<PtUser | undefined>();
    let { item } = toRefs(props);

    if (props.item) {
      itemForm.value = ptItemToFormModel(props.item);
      selectedAssignee.value = item.value.assignee as PtUser;
    }

    const assigneePickerOpen = () => {
      props.usersObs.subscribe((newUsers: PtUser[]) => {
        if (newUsers.length > 0) {
          users.value = newUsers;
          showAddModal.value = true;
        }
      });

      context.emit("usersRequested");
    };

    const onNonTextFieldChange = () => {
      notifyUpdateItem();
    };

    const onBlurTextField = () => {
      notifyUpdateItem();
    };

    const toggleModal = () => {
      showAddModal.value = !showAddModal.value;
      return false;
    };

    const assigneePickerClose = (user: PtUser) => {
      selectedAssignee.value = user;
      itemForm.value!.assigneeName = user.fullName;
      notifyUpdateItem();
      showAddModal.value = false;
    };

    const notifyUpdateItem = () => {
      if (!itemForm.value) {
        return;
      }
      const updatedItem = getUpdatedItem(
        props.item!,
        itemForm.value,
        selectedAssignee.value!
      );
      context.emit('itemSaved', updatedItem);
    };

    const getUpdatedItem = (
      item: PtItem,
      itemForm: PtItemDetailsEditFormModel,
      assignee: PtUser
    ): PtItem => {
      const updatedItem = Object.assign({}, item, {
        title: itemForm.title,
        description: itemForm.description,
        type: itemForm.typeStr,
        status: itemForm.statusStr,
        priority: itemForm.priorityStr,
        estimate: itemForm.estimate,
        assignee,
      });

      return updatedItem;
    };

    const itemSrc = (dataItem: PtItemType) => {
      return ItemType.imageResFromType(dataItem);
    };

    const indicatorClass = (itemPriority: PriorityEnum) => {
      return 'badge ' + getIndicatorClass(itemPriority);
    };

    const onSliderChange = (e: SliderChangeEvent) => {
      itemForm.value!.estimate = Math.round(e.value);
      notifyUpdateItem();
    };

     const reader = new FileReader();

    const imageLoaded = () => {
      if (selectedAssignee.value && reader.result) {
        selectedAssignee.value.avatar = reader.result.toString();
      }
    };

    const UploadStatusChange = (e: UploadOnStatusChangeEvent) => {
      if (!e.newState[0] || !e.newState[0].getRawFile) {
        return;
      }
      const status = e.newState[0].status;
      const file = e.newState[0].getRawFile();

      if (file && status === 4) {
        reader.onloadend = imageLoaded;
        reader.readAsDataURL(file);
      }
    };

    return {
      assigneePickerClose,
      toggleModal,
      onBlurTextField,
      assigneePickerOpen,
      onNonTextFieldChange,
      itemTypesProvider,
      statusesProvider,
      prioritiesProvider,
      showAddModal,
      users,
      selectedAssignee,
      itemForm,
      itemSrc,
      onSliderChange,
      indicatorClass,
      UploadStatusChange,
    };
  },
});
</script>
