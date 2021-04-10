<template>
  <div class="dashboard">
    <div
      class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3"
    >
      <div class="col-md order-md-first text-center text-md-left">
        <h2>
          <span class="small text-uppercase text-muted d-block">Statistics</span>
          <span
            v-if="this.filter.dateStart && this.filter.dateEnd"
          >{{formatDateEnUs(this.filter.dateStart)}} - {{formatDateEnUs(this.filter.dateEnd)}}</span>
        </h2>
      </div>

      <div class="btn-toolbar mb-2 mb-md-0">
        <div class="btn-group mr-2">
          <kendo-combobox
            :data-source="users"
            v-model="selectedUserIdStr"
            :placeholder="'Select assignee...'"
            @open="userFilterOpen"
            :data-text-field="'fullName'"
            :data-value-field="'id'"
            :template="userFilterItemTemplate"
            @change="userFilterValueChange"
            style="width: 250px;"
          ></kendo-combobox>

          <kendo-buttongroup>
            <button data-icon="calendar" class="k-flat" @click="(e) => onMonthRangeTap(3)">3 Months</button>
            
            <button data-icon="calendar" class="k-flat" @click="(e) => onMonthRangeTap(6)">6 Months</button>
            
            <button data-icon="calendar" class="k-flat" @click="(e) => onMonthRangeTap(12)">1 Year</button>
          </kendo-buttongroup>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-header">Active Issues</h3>
      <div class="card-block">
        <ActiveIssues :statusCounts="statusCounts"/>

        <div class="row">
          <div class="col-sm-12">
            <h3>All issues</h3>

            <kendo-chart
              title="All Issues"
              :category-axis-categories="categories"
              :category-axis-major-grid-lines-visible="false"
              :category-axis-labels-rotation="'auto'"
              category-axis-base-unit="months"
              :series="series"
              series-defaults-type="column"
              :series-defaults-stack="true"
              :series-defaults-gap="0.06"
              legend-position="bottom"
              theme="sass"
            >
              <kendo-chart-series-item
                name="Open"
                color="#CC3458"
                :opacity="0.7"
              ></kendo-chart-series-item>
              <kendo-chart-series-item
                name="Closed"
                color="#35C473"
                :opacity="0.7"
              ></kendo-chart-series-item>
            </kendo-chart>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
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

interface DateRange {
    dateStart: Date;
    dateEnd: Date;
}

@Component({
    components: {
        ActiveIssues,
    },
})
export default class DashboardPage extends Vue {
    public filter: DashboardFilter = {};
    public statusCounts: StatusCounts = {
        activeItemsCount: 0,
        closeRate: 0,
        closedItemsCount: 0,
        openItemsCount: 0,
    };
    public categories: Date[] = [];
    public series = [
      {
        name: 'Open',
        data: [],
        color: '#CC3458',
        opacity: 0.7
      },
      {
        name: 'Closed',
        data: [],
        color: '#35C473',
        opacity: 0.7
      },
    ];
    // public itemsOpenByMonth: number[] = [];
    // public itemsClosedByMonth: number[] = [];

    private store: Store = new Store();
    private dashboardRepo: DashboardRepository = new DashboardRepository();
    private dashboardService: DashboardService = new DashboardService(
        this.dashboardRepo
    );
    private userService: PtUserService = new PtUserService(this.store);
    private users: PtUser[] = [];
    private users$: Observable<PtUser[]> = this.store.select<PtUser[]>('users');
    private userFilterItemTemplate = `
      <div class="row" style="margin-left: 5px;">
                <img class="li-avatar rounded mx-auto d-block" src=#=avatar# />
                <span style="margin-left: 5px;">#= fullName #</span>
            </div>
    `;
    private selectedUserIdStr: string = '';

    public created() {
        this.users$.subscribe(users => {
            this.users = users;
        });
        this.refresh();
    }

    private refresh() {
        Promise.all<StatusCounts, FilteredIssues>([
            this.dashboardService.getStatusCounts(this.filter),
            this.dashboardService.getFilteredIssues(this.filter),
        ]).then(results => {
            this.statusCounts = results[0];
            this.updateStats(results[1]);
        });
    }

    private updateStats(issuesAll: FilteredIssues) {
        const cats = issuesAll.categories.map(c => new Date(c));

        const itemsOpenByMonth: number[] = [];
        const itemsClosedByMonth: number[] = [];

        issuesAll.items.forEach((item, index) => {
            itemsOpenByMonth.push(item.open.length);
            itemsClosedByMonth.push(item.closed.length);
        });

        this.categories = cats;
        // this.itemsOpenByMonth = itemsOpenByMonth;
        // this.itemsClosedByMonth = itemsClosedByMonth;
        this.series[0].data = itemsOpenByMonth as any;
        this.series[1].data = itemsClosedByMonth as any;
    }

    private userFilterOpen() {
        this.userService.fetchUsers();
    }

    private userFilterValueChange(e: any) {
        if (this.selectedUserIdStr) {
            this.filter.userId = Number(this.selectedUserIdStr);
        } else {
            this.filter.userId = undefined;
        }
        this.refresh();
    }

    private onMonthRangeTap(months: number) {
        const range = this.getDateRange(months);
        this.filter = {
            userId: this.filter.userId,
            dateEnd: range.dateEnd,
            dateStart: range.dateStart,
        };
        this.refresh();
    }

    private getDateRange(months: number): DateRange {
        const now = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - months);
        return {
            dateStart: start,
            dateEnd: now,
        };
    }

    private formatDateEnUs(date: Date) {
        return formatDateEnUs(date);
    }
}
</script>
