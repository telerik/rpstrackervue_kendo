<template>
  <div class="dashboard">
    <div
      class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3"
    >
      <div class="col-md order-md-first text-center text-md-left">
        <h2>
          <span class="small text-uppercase text-muted d-block">Statistics</span>
          <span
            v-if="filter.dateStart && filter.dateEnd"
          >{{formatDateEnUs(filter.dateStart)}} - {{formatDateEnUs(filter.dateEnd)}}</span>
        </h2>
      </div>

      <div class="btn-toolbar mb-2 mb-md-0">
        <div class="btn-group mr-2">
          <kendo-combobox
            :data-items="users"
            :text-field="'fullName'"
            :placeholder="'Select assignee...'"
            @open="userFilterOpen"
            :item-render="'userFilterItemTemplate'"
            @change="userFilterValueChange"
            :style="{width: '250px'}"
          >
            <template v-slot:userFilterItemTemplate="{props}">
              <div :class="{ row: true, ...props.itemClass}" style="margin-left: 5px;" @click="(ev) => props.onClick(ev)">
                <img class="li-avatar rounded" :src="props.dataItem.avatar" />
                <span style="margin-left: 5px;">{{ props.dataItem.fullName }}</span>
              </div>
            </template>
          </kendo-combobox>

          <kendo-buttongroup>
            <kendo-button :fill-mode="'flat'" :svg-icon="calendarIcon" @click="onMonthRangeTap(3)">3 Months</kendo-button>
            <kendo-button :fill-mode="'flat'" :svg-icon="calendarIcon" @click="onMonthRangeTap(6)">6 Months</kendo-button>
            <kendo-button :fill-mode="'flat'" :svg-icon="calendarIcon" @click="onMonthRangeTap(12)">1 Year</kendo-button>
          </kendo-buttongroup>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-header">Active Issues</h3>
      <div class="card-block">
        <ActiveIssues :statusCounts="statusCounts" />

        <div class="row">
          <div class="col-sm-12">
            <h3>All issues</h3>
             <kendo-chart :theme="'sass'">
              <ChartTitle
                :text="'All Issues'"
                :position="'top'"
                :align="'center'"
              />
              <ChartCategoryAxis>
                <ChartCategoryAxisItem
                  :categories="categories"
                  :axis-crossing-value="[0, 20]"
                  :axis-major-grid-lines-visible="false"
                  :axis-labels-rotation="'auto'"
                  :axis-base-unit="'months'"
                />
              </ChartCategoryAxis>
              <ChartLegend :position="'bottom'"  />
              <ChartSeriesDefaults :type="'column'" :stack="true" :gap="0.06" />
              <ChartSeries>
                <ChartSeriesItem 
                  :name="'Open'" 
                  :data-items="itemsOpenByMonth" 
                  :color="'#CC3458'"
                  :opacity="0.7" />
                <ChartSeriesItem 
                  :name="'Closed'" 
                  :data-items="itemsClosedByMonth" 
                  :color="'#35C473'"
                  :opacity="0.7" />
              </ChartSeries>
            </kendo-chart>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Observable } from 'rxjs';

import { PtItem, PtUser } from '@/core/models/domain';
import { Store } from '@/core/state/app-store';
import {
    DashboardRepository,
    DashboardFilter,
    FilteredIssues,
} from '@/repositories/dashboard-repository';
import { DashboardService } from '@/services/dashboard-service';
import {
    TypeCounts,
    PriorityCounts,
    StatusCounts,
} from '@/shared/models/ui/stats';
import { formatDateEnUs } from '@/core/helpers/date-utils';
import ActiveIssues from '@/components/dashboard/ActiveIssues.vue';
import { PtUserService } from '@/core/services/pt-user-service';
import { ComboBox, ComboBoxChangeEvent } from "@progress/kendo-vue-dropdowns";
import { Button, ButtonGroup } from "@progress/kendo-vue-buttons";
import {
  Chart,
  ChartSeries,
  ChartSeriesItem,
  ChartTitle,
  ChartLegend,
  ChartCategoryAxis,
  ChartCategoryAxisItem,
  ChartSeriesDefaults,
} from "@progress/kendo-vue-charts";

interface DateRange {
  dateStart: Date;
  dateEnd: Date;
}

import { defineComponent, ref } from "vue";
import { calendarIcon } from "@progress/kendo-svg-icons";

export default defineComponent({
  name: "DashboardPage",
  components: {
    ActiveIssues,
    "kendo-combobox": ComboBox,
    "kendo-button": Button,
    "kendo-buttongroup": ButtonGroup,
    "kendo-chart": Chart,
    ChartSeries,
    ChartSeriesItem,
    ChartTitle,
    ChartLegend,
    ChartCategoryAxis,
    ChartCategoryAxisItem,
    ChartSeriesDefaults,
  },
  setup() {
    const filter = ref<DashboardFilter>({});
    const statusCounts = ref<StatusCounts>({
      activeItemsCount: 0,
      closeRate: 0,
      closedItemsCount: 0,
      openItemsCount: 0,
    });

    const categories = ref<Date[]>([]);
    const itemsOpenByMonth = ref<number[]>([]);
    const itemsClosedByMonth = ref<number[]>([]);

    const store: Store = new Store();
    const dashboardRepo: DashboardRepository = new DashboardRepository();
    const dashboardService: DashboardService = new DashboardService(
      dashboardRepo
    );

    const userService: PtUserService = new PtUserService(store);
    const users = ref<PtUser[]>([]);
    const users$: Observable<PtUser[]> = store.select<PtUser[]>("users");

    users$.subscribe((newUsers: PtUser[]) => {
      users.value = newUsers;
    });

    const refresh = () => {
      Promise.all<StatusCounts, FilteredIssues>([
        dashboardService.getStatusCounts(filter.value as DashboardFilter),
        dashboardService.getFilteredIssues(filter.value as DashboardFilter),
      ]).then((results) => {
        statusCounts.value = results[0];
        updateStats(results[1]);
      });
    };

    const updateStats = (issuesAll: FilteredIssues) => {
      const cats = issuesAll.categories.map(c => new Date(c));

      const open: number[] = [];
      const closed: number[] = [];

      issuesAll.items.forEach((item, index) => {
        open.push(item.open.length);
        closed.push(item.closed.length);
      });

      categories.value = cats;

      itemsOpenByMonth.value = open;
      itemsClosedByMonth.value = closed;
    };

    const userFilterOpen = () => {
      userService.fetchUsers();
    };


    refresh();

    const userFilterValueChange = (e: ComboBoxChangeEvent) => {
      if (e.value) {
        filter.value.userId = Number(e.value.id);
      } else {
        filter.value.userId = undefined;
      }
      refresh();
    };

    const onMonthRangeTap = (months: number) => {
      const range = getDateRange(months);
      filter.value = {
        userId: filter.value.userId,
        dateEnd: range.dateEnd,
        dateStart: range.dateStart,
      };
      refresh();
    };

    const getDateRange = (months: number): DateRange => {
      const now = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - months);
      return {
        dateStart: start,
        dateEnd: now,
      };
    };


    return {
      formatDateEnUs,
      onMonthRangeTap,
      refresh,
      filter,
      statusCounts,
      categories,
      itemsOpenByMonth,
      itemsClosedByMonth,
      userFilterValueChange,
      users,
      userFilterOpen,
      calendarIcon
    };
  },
});
</script>
