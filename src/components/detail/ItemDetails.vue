<template>
  <div>
    <form>
      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Title</label>
        <div class="col-sm-10">
          <input
            class="k-textbox"
            v-model="itemForm.title"
            @blur="onBlurTextField"
            name="title"
            style="width: 100%;"
          >
        </div>
      </div>

      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Description</label>
        <div class="col-sm-10">
          <textarea
            class="k-textarea"
            v-model="itemForm.description"
            @blur="onBlurTextField"
            name="description"
            style="width: 100%;"
          ></textarea>
        </div>
      </div>

      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Item Type</label>
        <div class="col-sm-10">
          <kendo-dropdownlist
            v-model="itemForm.typeStr"
            :data-source="itemTypesProvider"
            @close="onNonTextFieldChange"
            :template="(i)=>itemTypeTemplate(i)"
            name="itemType"
          ></kendo-dropdownlist>
        </div>
      </div>

      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Status</label>
        <div class="col-sm-10">
          <kendo-dropdownlist
            v-model="itemForm.statusStr"
            :data-source="statusesProvider"
            @close="onNonTextFieldChange"
            name="itemStatus"
          ></kendo-dropdownlist>
        </div>
      </div>

      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Estimate</label>

        <div class="col-sm-10">
          <kendo-slider
            v-model="itemForm.estimate"
            :min="0"
            :max="20"
            @change="(e)=>onSliderChange(e)"
            name="estimate"
          ></kendo-slider>
        </div>
      </div>

      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Priority</label>
        <div class="col-sm-10">
          <kendo-dropdownlist
            v-model="itemForm.priorityStr"
            :data-source="prioritiesProvider"
            @close="onNonTextFieldChange"
            :template="(p)=>itemPriorityTemplate(p)"
            name="itemPrority"
          ></kendo-dropdownlist>
        </div>
      </div>

      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Assignee</label>

        <div class="col-sm-10">
          <img :src="this.selectedAssignee.avatar" class="li-avatar rounded">
          <span>{{itemForm.assigneeName}}</span>
          
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="assigneePickerOpen"
          >Pick assignee</button>
        </div>
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
import { Component, Vue, Prop, Emit } from 'vue-property-decorator';
import { Observable } from 'rxjs';

import { PtItem, PtUser } from '@/core/models/domain';
import {
    ItemType,
    PT_ITEM_STATUSES,
    PT_ITEM_PRIORITIES,
} from '@/core/constants';
import {
    PtItemDetailsEditFormModel,
    ptItemToFormModel,
} from '@/shared/models/forms/pt-item-details-edit-form';
import { EMPTY_STRING } from '@/core/helpers';
import { PriorityEnum, StatusEnum } from '@/core/models/domain/enums';
import { PtItemType } from '@/core/models/domain/types';
import { getIndicatorClass } from '@/shared/helpers/priority-styling';

@Component
export default class PtItemDetails extends Vue {
    @Prop() public item!: PtItem;
    @Prop() public usersObs!: Observable<PtUser[]>;

    public itemTypesProvider = ItemType.List.map(t => t.PtItemType);
    public statusesProvider = PT_ITEM_STATUSES;
    public prioritiesProvider = PT_ITEM_PRIORITIES;

    public showAddModal: boolean = false;
    public users: PtUser[] = [];
    public itemForm: PtItemDetailsEditFormModel | undefined;
    public selectedAssignee: PtUser | undefined;

    @Emit('usersRequested')
    public usersRequested() {}
    @Emit('itemSaved')
    public itemSaved(item: PtItem): void {}

    public created() {
        if (this.item) {
            this.itemForm = ptItemToFormModel(this.item);
            this.selectedAssignee = this.item.assignee;
        }
    }

    public assigneePickerOpen() {
        this.usersObs.subscribe((users: PtUser[]) => {
            if (users.length > 0) {
                this.users = users;
                this.showAddModal = true;
            }
        });

        this.usersRequested();
    }

    public onNonTextFieldChange() {
        this.notifyUpdateItem();
    }

    public onBlurTextField() {
        this.notifyUpdateItem();
    }

    public onSliderChange(e: any) {
        this.itemForm!.estimate = e.value;
        this.notifyUpdateItem();
    }

    private toggleModal() {
        this.showAddModal = !this.showAddModal;
        return false;
    }

    private assigneePickerClose(user: PtUser) {
        this.selectedAssignee = user;
        this.itemForm!.assigneeName = user.fullName;
        this.notifyUpdateItem();
        this.showAddModal = false;
    }

    private notifyUpdateItem() {
        if (!this.itemForm) {
            return;
        }
        const updatedItem = this.getUpdatedItem(
            this.item!,
            this.itemForm,
            this.selectedAssignee!
        );
        this.itemSaved(updatedItem);
    }

    private getUpdatedItem(
        item: PtItem,
        itemForm: PtItemDetailsEditFormModel,
        assignee: PtUser
    ): PtItem {
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
    }

    private itemTypeTemplate(itemType: PtItemType) {
        return `
        <div>
          <img src=${ItemType.imageResFromType(
              itemType
          )} class="backlog-icon" />
                <span>${itemType}</span>
            </div>
        `;
    }

    private itemPriorityTemplate(itemPriority: PriorityEnum) {
        return `
            <span class="${'badge ' +
                getIndicatorClass(itemPriority)}">${itemPriority}</span>
        `;
    }
}
</script>
