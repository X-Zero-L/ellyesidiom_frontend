export interface UserVoteModel {
  user_id: string;
  vote_list: string[][];
  ext_info: { [key: string]: string };
  vote_record: string[];
  vote_count: number;
}

export interface UserVoteSubmitModel {
  record: string[];
}
