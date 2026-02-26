# build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# copy csproj and restore
COPY EmployeeManager.WebAPI.csproj ./
RUN dotnet restore

# copy everything and publish
COPY . ./
RUN dotnet publish -c Release -o /app/publish

# runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# ASP.NET Core will listen on 8080 in container
ENV ASPNETCORE_URLS=http://+:8080

# data folder for sqlite
RUN mkdir -p /app/data

COPY --from=build /app/publish ./

EXPOSE 8080
ENTRYPOINT ["dotnet", "EmployeeManager.WebAPI.dll"]