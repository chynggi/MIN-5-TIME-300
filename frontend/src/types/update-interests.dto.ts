export interface InterestInputDto {
  interest: string;
  priority: number;
}

export interface UpdateInterestsDto {
  interests: InterestInputDto[];
}

export interface InterestResponseDto {
  id: string;
  interest: string;
  priority: number;
}
