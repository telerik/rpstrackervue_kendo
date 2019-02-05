<template>
  <div>
    <div
      class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3"
    >
      <h1 class="h2">Backlog</h1>
      <div class="btn-toolbar mb-2 mb-md-0">
        <PresetFilter :selectedPreset="currentPreset" @onPresetSelected="onSelectPresetTap"/>

        <div class="btn-group mr-2">
          <button type="button" @click="toggleModal" class="btn btn-sm btn-outline-secondary">Add</button>
        </div>
      </div>
    </div>

    <Grid
      :data-items="items"
      :cell-render="'cellTemplate'"
      :columns="columns"
      style="height: 400px"
    >
      <template slot="cellTemplate" slot-scope="{props}">
        <td :class="props.className" v-html="getNestedValue(props)"></td>
      </template>
    </Grid>

    <transition v-if="showAddModal">
      <div class="modal-mask">
        <div class="modal-wrapper">
          <div class="modal-container">
            <div class="modal-header">
              <h4 class="modal-title" id="modal-basic-title">Add New Item</h4>
              <button type="button" class="close" @click="toggleModal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <div class="modal-body">
              <form>
                <div class="form-group row">
                  <label class="col-sm-2 col-form-label">Title</label>
                  <div class="col-sm-10">
                    <input
                      class="k-textbox"
                      v-model="newItem.title"
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
                      v-model="newItem.description"
                      name="description"
                      style="width: 100%;"
                    ></textarea>
                  </div>
                </div>

                <div class="form-group row">
                  <label class="col-sm-2 col-form-label">Item Type</label>
                  <div class="col-sm-10">
                    <select class="form-control" v-model="newItem.typeStr" name="itemType">
                      <option v-for="t in itemTypesProvider" :key="t" :value="t">{{t}}</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>

            <div class="modal-footer">
              <button class="btn" @click="toggleModal">Cancel</button>
              <button class="btn btn-primary" @click="onAddSave">OK</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Model, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';

import { BacklogService } from '@/services/backlog-service';
import { BacklogRepository } from '@/repositories/backlog-repository';
import { EMPTY_STRING } from '@/core/helpers';
import { Store } from '@/core/state/app-store';

import { PresetType } from '@/core/models/domain/types';
import { PtItem, PtUser } from '@/core/models/domain';
import { ItemType } from '@/core/constants';
import { PtNewItem } from '@/shared/models/dto/pt-new-item';
import PresetFilter from '@/components/PresetFilter.vue';
import { getIndicatorClass } from '@/shared/helpers/priority-styling';
import { GridColumnProps } from '@progress/kendo-vue-grid';

@Component({
    components: {
        PresetFilter,
    },
})
export default class BacklogPage extends Vue {
    public currentPreset: PresetType;
    public items: PtItem[];
    public itemTypesProvider = ItemType.List.map(t => t.PtItemType);
    public showAddModal: boolean;
    public newItem: PtNewItem;
    private store: Store = new Store();
    private backlogRepo: BacklogRepository = new BacklogRepository();
    private backlogService: BacklogService = new BacklogService(
        this.backlogRepo,
        this.store
    );

    private columns: GridColumnProps[] = [
        { field: 'type', title: ' ', width: 40 },
        {
            field: 'assignee',
            title: 'Assignee',
            width: 260,
        },
        { field: 'title', title: 'Title' },
        { field: 'priority', title: 'Priority', width: 100 },
        { field: 'estimate', title: 'Estimate', width: 100 },
        { field: 'dateCreated', title: 'Created', width: 160 },
    ];

    constructor() {
        super();

        this.currentPreset = 'open';
        this.items = [];
        this.showAddModal = false;
        this.newItem = this.initModalNewItem();
    }

    @Watch('$route')
    public onRouteChange(val: Route, oldVal: Route) {
        this.refresh();
    }

    public created() {
        this.currentPreset = this.$route.params.preset as PresetType;
        this.refresh();
    }

    public listItemTap(item: PtItem) {
        // navigate to detail page
        this.$router.push(`/detail/${item.id}`);
    }

    public getIndicatorImage(item: PtItem) {
        return ItemType.imageResFromType(item.type);
    }

    public getPriorityClass(item: PtItem): string {
        const indicatorClass = getIndicatorClass(item.priority);
        return indicatorClass;
    }

    public onAddSave() {
        if (this.store.value.currentUser) {
            this.backlogService
                .addNewPtItem(this.newItem, this.store.value.currentUser)
                .then((nextItem: PtItem) => {
                    this.showAddModal = false;
                    this.newItem = this.initModalNewItem();
                    this.items = [nextItem, ...this.items];
                });
        }
    }

    private refresh() {
        this.backlogService.getItems(this.currentPreset).then(ptItems => {
            this.items = ptItems;
        });
    }

    private onSelectPresetTap(preset: PresetType) {
        this.currentPreset = preset;
        this.$router.push('/backlog/' + preset);
    }

    private toggleModal() {
        this.showAddModal = !this.showAddModal;
    }

    private initModalNewItem(): PtNewItem {
        return {
            title: EMPTY_STRING,
            description: EMPTY_STRING,
            typeStr: 'PBI',
        };
    }

    private getNestedValue(props: any) {
        const fieldName = props.field;
        const dataItem = props.dataItem as PtItem;
        switch (fieldName) {
            case 'type':
                return this.getItemTypeCellMarkup(dataItem);
            case 'assignee':
                return this.getAssigneeCellMarkup(dataItem.assignee);
            case 'priority':
                return this.getPriorityCellMarkup(dataItem);
            case 'dateCreated':
                return this.getCreatedDateCellMarkup(dataItem);
            default:
                return (dataItem as any)[fieldName];
        }
    }

    /*
    private cellRendererAssignee(h: any, tdElement: any, props: any) {
        return h('td', [props.dataItem.assignee.fullName]);
    }
    */

    private getItemTypeCellMarkup(item: PtItem) {
        return `<img src="${this.getIndicatorImage(
            item
        )}" class="backlog-icon" />`;
    }

    private getAssigneeCellMarkup(user: PtUser) {
        return `
        <div>
          <img src="${user.avatar}" class="li-avatar rounded mx-auto" />
          <span style="margin-left: 10px;">${user.fullName}</span>
        </div>
      `;
    }

    private getPriorityCellMarkup(item: PtItem) {
        return `<span class="${'badge ' + this.getPriorityClass(item)}">${
            item.priority
        }</span>`;
    }

    private getCreatedDateCellMarkup(item: PtItem) {
        return `<span class="li-date">${item.dateCreated.toDateString()}</span>`;
    }
}
</script>

<style scoped>
.backlog-icon {
    height: 20px;
}

.li-indicator {
    height: 58px;
    width: 10px;
    text-align: left;
}

.li-indicator div {
    width: 5px;
    height: 58px;
}

.li-info-wrapper {
    margin-left: 5px;
}

.li-title {
    font-size: 14px;
    color: #4b5833;
}

.pt-table-row {
    cursor: pointer;
}
</style>
