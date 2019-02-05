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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

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
    private dashboardRepo: DashboardRepository = new DashboardRepository();
    private dashboardService: DashboardService = new DashboardService(
        this.dashboardRepo
    );

    public created() {
        this.refresh();
    }

    private refresh() {
        this.dashboardService.getStatusCounts(this.filter).then(result => {
            this.statusCounts = result;
        });
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
