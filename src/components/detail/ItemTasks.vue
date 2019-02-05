<template>
  <form>
    <div class="form-row align-items-center">
      <div class="col-sm-6">
        <input
          v-model="newTaskTitle"
          placeholder="Enter new task..."
          class="form-control pt-text-task-add"
          name="newTask"
        >
      </div>
      <button
        type="button"
        @click="() => onAddTapped()"
        class="btn btn-primary"
        :disabled="!newTaskTitle"
      >Add</button>
    </div>

    <hr>

    <div v-for="task in tasks" :key="task.id" class="input-group mb-3 col-sm-6">
      <div class="input-group-prepend">
        <div class="input-group-text">
          <input
            type="checkbox"
            :checked="task.completed"
            @change="() => onToggleTapped(task)"
            aria-label="Checkbox for following text input"
            :name="'checked' + task.id"
          >
        </div>
      </div>
      <input
        :value="task.title"
        @input="(e) => onTaskTitleChange(task, e)"
        @blur="() => onTaskBlurred(task)"
        type="text"
        class="form-control"
        aria-label="Text input with checkbox"
        :name="'tasktitle' + task.id"
      >

      <div class="input-group-append">
        <button class="btn btn-danger" type="button" @click="() => onTaskDelete(task)">Delete</button>
      </div>
    </div>
  </form>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit, Watch } from 'vue-property-decorator';
import { EMPTY_STRING } from '@/core/helpers/string-helpers';
import { PtTask } from '@/core/models/domain';
import { PtNewTask } from '@/shared/models/dto/pt-new-task';
import { PtTaskUpdate } from '@/shared/models/dto/pt-task-update';

@Component
export default class PtItemTasks extends Vue {
    @Prop() public tasks!: PtTask[];

    public newTaskTitle = EMPTY_STRING;
    private lastUpdatedTitle = EMPTY_STRING;
    @Emit('addNewTask')
    public addNewTask(newTask: PtNewTask) {}
    @Emit('updateTask')
    public updateTask(taskUpdate: PtTaskUpdate) {}

    public onAddTapped() {
        const newTitle = this.newTaskTitle.trim();
        if (newTitle.length === 0) {
            return;
        }
        const newTask: PtNewTask = {
            title: newTitle,
            completed: false,
        };
        this.addNewTask(newTask);

        this.newTaskTitle = EMPTY_STRING;
    }

    public onToggleTapped(task: PtTask) {
        const taskUpdate: PtTaskUpdate = {
            task,
            toggle: true,
        };
        this.updateTask(taskUpdate);
    }

    public onTaskTitleChange(task: PtTask, event: any) {
        if (task.title === event.target.value) {
            return;
        }
        this.lastUpdatedTitle = event.target.value;
    }

    public onTaskBlurred(task: PtTask) {
        if (task.title === this.lastUpdatedTitle) {
            return;
        }
        const taskUpdate: PtTaskUpdate = {
            task,
            toggle: false,
            newTitle: this.lastUpdatedTitle,
        };
        this.updateTask(taskUpdate);
        this.lastUpdatedTitle = EMPTY_STRING;
    }

    public onTaskDelete(task: PtTask) {
        const taskUpdate: PtTaskUpdate = {
            task,
            toggle: false,
            delete: true,
        };
        this.updateTask(taskUpdate);
    }
}
</script>
