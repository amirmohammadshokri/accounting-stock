using FluentValidation;

namespace Accounting.Application.Contacts.Queries.GetById;

public class GetContactByIdValidator : AbstractValidator<GetContactByIdQuery>
{
    public GetContactByIdValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
    }
}
