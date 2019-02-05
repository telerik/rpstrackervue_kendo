import { PtItem } from '../../../core/models/domain';

export interface PtItemDetailsEditFormModel {
    title: string;
    description: string;
    typeStr: string;
    statusStr: string;
    estimate: number;
    priorityStr: string;
    assigneeName: string;
}

export function ptItemToFormModel(item: PtItem): PtItemDetailsEditFormModel {
    if (item) {
        return {
            title: item.title ? item.title : '',
            description: item.description ? item.description : '',
            typeStr: item.type,
            statusStr: item.status,
            estimate: item.estimate,
            priorityStr: item.priority,
            assigneeName: item.assignee ? item.assignee.fullName : 'unassigned',
        };
    } else {
        return {
            title: '',
            description: '',
            typeStr: 'PBI',
            statusStr: 'Open',
            estimate: 0,
            priorityStr: 'Low',
            assigneeName: 'unassigned',
        };
    }
}
