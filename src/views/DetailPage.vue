<template>
  <div v-if="item !== null">
    <div
      class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3"
    >
      <h1 class="h2">{{ item.title }}</h1>
      <div class="btn-toolbar mb-2 mb-md-0">
        <div class="btn-group mr-2">
          <button
            type="button"
            @click="onScreenSelected('details')"
            class="btn btn-sm btn-outline-secondary"
          >Details</button>
          
          <button
            type="button"
            @click="onScreenSelected('tasks')"
            class="btn btn-sm btn-outline-secondary"
          >Tasks</button>
          
          <button
            type="button"
            @click="onScreenSelected('chitchat')"
            class="btn btn-sm btn-outline-secondary"
          >Chitchat</button>
        </div>
      </div>
    </div>

    <PtItemDetails
      v-if="selectedDetailsScreen === 'details'"
      :item="item"
      :usersObs="users$"
      @usersRequested="onUsersRequested"
      @itemSaved="onItemSaved"
    />

    <PtItemTasks
      v-else-if="selectedDetailsScreen === 'tasks'"
      :tasks="item.tasks"
      @addNewTask="onAddNewTask"
      @updateTask="onUpdateTask"
    />

    <PtItemChitchat
      v-else-if="selectedDetailsScreen === 'chitchat'"
      :comments="item.comments"
      :currentUser="currentUser"
      @addNewComment="onAddNewComment"
    />
  </div>
</template>


<script lang="ts">
import { Component, Vue, Model, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';

import { Observable } from 'rxjs';

import { BacklogService } from '@/services/backlog-service';
import { BacklogRepository } from '@/repositories/backlog-repository';
import { PtUserService } from '@/core/services/pt-user-service';
import { EMPTY_STRING } from '@/core/helpers';
import { Store } from '@/core/state/app-store';

import { PresetType } from '@/core/models/domain/types';
import { PtItem, PtTask, PtUser } from '@/core/models/domain';
import { ItemType } from '@/core/constants';
import { PtNewItem } from '@/shared/models/dto/pt-new-item';
import PtItemDetails from '@/components/detail/ItemDetails.vue';
import PtItemTasks from '@/components/detail/ItemTasks.vue';
import PtItemChitchat from '@/components/detail/ItemChitchat.vue';
import { getIndicatorClass } from '@/shared/helpers/priority-styling';

import { DetailScreenType } from '@/shared/models/ui/types/detail-screens';
import { PtNewTask } from '@/shared/models/dto/pt-new-task';
import { PtTaskUpdate } from '@/shared/models/dto/pt-task-update';
import { PtNewComment } from '@/shared/models/dto/pt-new-comment';

@Component({
    components: {
        PtItemDetails,
        PtItemTasks,
        PtItemChitchat,
    },
})
export default class DetailPage extends Vue {
    public selectedDetailsScreen: DetailScreenType = 'details';
    private store: Store = new Store();
    private backlogRepo: BacklogRepository = new BacklogRepository();
    private backlogService: BacklogService = new BacklogService(
        this.backlogRepo,
        this.store
    );
    private ptUserService: PtUserService = new PtUserService(this.store);

    private itemId: number = 0;
    private item: PtItem | null = null;
    private currentUser: PtUser | undefined = this.store.value.currentUser;
    private users$: Observable<PtUser[]> = this.store.select<PtUser[]>('users');

    constructor() {
        super();
    }

    public created() {
        this.selectedDetailsScreen = this.$route.params
            .screen as DetailScreenType;
        this.itemId = Number(this.$route.params.id);
        this.refresh();
    }

    public onScreenSelected(screen: DetailScreenType) {
        this.selectedDetailsScreen = screen;
        this.$router.push(`/detail/${this.itemId}/${screen}`);
    }

    public onItemSaved(item: PtItem) {
        this.backlogService.updatePtItem(item).then((updateItem: PtItem) => {
            this.item = updateItem;
        });
    }

    public onAddNewTask(newTask: PtNewTask) {
        if (this.item) {
            this.backlogService
                .addNewPtTask(newTask, this.item)
                .then(nextTask => {
                    this.item!.tasks = [nextTask].concat(this.item!.tasks);
                });
        }
    }

    public onUpdateTask(taskUpdate: PtTaskUpdate) {
        if (this.item) {
            if (taskUpdate.delete) {
                this.backlogService
                    .deletePtTask(this.item, taskUpdate.task)
                    .then(ok => {
                        if (ok) {
                            const newTasks = this.item!.tasks.filter(task => {
                                if (task.id !== taskUpdate.task.id) {
                                    return task;
                                }
                            });
                            this.item!.tasks = newTasks;
                        }
                    });
            } else {
                this.backlogService
                    .updatePtTask(
                        this.item,
                        taskUpdate.task,
                        taskUpdate.toggle,
                        taskUpdate.newTitle
                    )
                    .then(updatedTask => {
                        const newTasks = this.item!.tasks.map(task => {
                            if (task.id === updatedTask.id) {
                                return updatedTask;
                            } else {
                                return task;
                            }
                        });
                        this.item!.tasks = newTasks;
                    });
            }
        }
    }

    public onAddNewComment(newComment: PtNewComment) {
        if (this.item) {
            this.backlogService
                .addNewPtComment(newComment, this.item)
                .then(nextComment => {
                    this.item!.comments = [nextComment].concat(
                        this.item!.comments
                    );
                });
        }
    }

    public onUsersRequested() {
        this.ptUserService.fetchUsers();
    }

    public getIndicatorImage(item: PtItem) {
        return ItemType.imageResFromType(item.type);
    }

    public getPriorityClass(item: PtItem): string {
        const indicatorClass = getIndicatorClass(item.priority);
        return indicatorClass;
    }

    private refresh() {
        this.backlogService.getPtItem(this.itemId).then(item => {
            this.item = item;
        });
    }

    private initModalNewItem(): PtNewItem {
        return {
            title: EMPTY_STRING,
            description: EMPTY_STRING,
            typeStr: 'PBI',
        };
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
