namespace GameStore.Api.Ai;

public record AiRequest(
    string Message,
    string? PageId
);