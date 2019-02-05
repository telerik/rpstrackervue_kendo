<template>
  <div>
    <form>
      <div class="form-row align-items-center">
        <img :src="currentUser.avatar" class="mr-3 li-avatar rounded">

        <div class="col-sm-6">
          <textarea
            v-model="newCommentText"
            placeholder="Enter new comment..."
            class="form-control pt-text-comment-add"
            name="newComment"
          ></textarea>
        </div>
        <button
          type="button"
          @click="onAddTapped"
          class="btn btn-primary"
          :disabled="!newCommentText"
        >Add</button>
      </div>
    </form>

    <hr>

    <ul class="list-unstyled">
      <li v-for="comment in comments" :key="comment.id" class="media chitchat-item">
        <img :src="comment.user.avatar" class="mr-3 li-avatar rounded">
        <div class="media-body">
          <h6 class="mt-0 mb-1">
            <span>{{comment.user.fullName}}</span>
            <span class="li-date">{{comment.dateCreated.toDateString()}}</span>
          </h6>

          <span class="chitchat-text">{{comment.title}}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit, Watch } from 'vue-property-decorator';
import { EMPTY_STRING } from '@/core/helpers/string-helpers';
import { PtComment, PtUser } from '@/core/models/domain';
import { PtNewComment } from '@/shared/models/dto/pt-new-comment';

@Component
export default class PtItemChitchat extends Vue {
    @Prop() public comments!: PtComment[];
    @Prop() public currentUser!: PtUser;

    public newCommentText = EMPTY_STRING;
    @Emit('addNewComment')
    public addNewComment(newComment: PtNewComment) {}

    public onAddTapped() {
        const newTitle = this.newCommentText.trim();
        if (newTitle.length === 0) {
            return;
        }
        const newComment: PtNewComment = {
            title: newTitle,
        };
        this.addNewComment(newComment);

        this.newCommentText = EMPTY_STRING;
    }
}
</script>

<style scoped>
.chitchat-item {
    margin-top: 20px;
}

.chitchat-text {
    color: #495057;
    font-size: 0.9em;
}
</style>
